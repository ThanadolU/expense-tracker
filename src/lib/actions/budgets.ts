"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { monthRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type BudgetFormState = {
  error?: string;
  success?: string;
} | null;

function revalidateBudgetPaths() {
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseYear(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1970 && n <= 2100 ? n : null;
}

function parseMonth(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

function parseYearMonth(
  formData: FormData,
): { ok: true; year: number; month: number } | { ok: false; error: string } {
  const year = parseYear(readString(formData.get("year")));
  const month = parseMonth(readString(formData.get("month")));
  if (year === null || month === null) {
    return { ok: false, error: "Invalid month." };
  }
  return { ok: true, year, month };
}

function parseBudgetAmount(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  if (!raw) {
    return { ok: false, error: "Amount is required." };
  }
  // Normalize comma decimals
  const normalized = raw.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return {
      ok: false,
      error: "Enter a valid amount with up to 2 decimal places.",
    };
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (n >= 1_000_000_000_000) {
    return { ok: false, error: "Amount is too large." };
  }
  return { ok: true, value: normalized };
}

async function assertCategoryOwned(categoryId: string, userId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
}

/**
 * Find the overall (categoryId null) budget row for a month, if any.
 * Postgres does not enforce uniqueness across NULL categoryId values, so
 * "at most one overall budget per month" is enforced here, not by the DB.
 */
async function findOverallBudget(userId: string, year: number, month: number) {
  return prisma.budget.findFirst({
    where: { userId, year, month, categoryId: null },
  });
}

/** All budgets (overall + per-category) a user set for a given month. */
export async function getBudgetsForMonth(userId: string, year: number, month: number) {
  return prisma.budget.findMany({
    where: { userId, year, month },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
    orderBy: [{ categoryId: "asc" }],
  });
}

export type BudgetSummary = {
  overall: { amount: string; spent: string } | null;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    amount: string;
    spent: string;
  }>;
};

/**
 * Budgets for the month paired with actual spend (from Expense rows, not
 * stored on Budget). Feeds the budgets page and dashboard "spent vs budget".
 */
export async function getBudgetSummaryForMonth(
  userId: string,
  year: number,
  month: number,
): Promise<BudgetSummary> {
  const { start, endExclusive } = monthRange(year, month);
  const spentAt = { gte: start, lt: endExclusive };

  const [budgets, totalSpent, categorySpent] = await Promise.all([
    getBudgetsForMonth(userId, year, month),
    prisma.expense.aggregate({
      where: { userId, spentAt },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, spentAt },
      _sum: { amount: true },
    }),
  ]);

  const spentByCategory = new Map(
    categorySpent.map((row) => [row.categoryId, row._sum.amount?.toString() ?? "0"]),
  );

  const overallBudget = budgets.find((budget) => budget.categoryId === null) ?? null;

  return {
    overall: overallBudget
      ? {
          amount: overallBudget.amount.toString(),
          spent: totalSpent._sum.amount?.toString() ?? "0",
        }
      : null,
    categories: budgets
      .filter((budget) => budget.categoryId !== null && budget.category)
      .map((budget) => ({
        categoryId: budget.categoryId as string,
        categoryName: budget.category!.name,
        amount: budget.amount.toString(),
        spent: spentByCategory.get(budget.categoryId as string) ?? "0",
      })),
  };
}

export async function upsertOverallBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const userId = await requireUserId();

  const yearMonth = parseYearMonth(formData);
  if (!yearMonth.ok) {
    return { error: yearMonth.error };
  }
  const { year, month } = yearMonth;

  const amount = parseBudgetAmount(readString(formData.get("amount")));
  if (!amount.ok) {
    return { error: amount.error };
  }

  const existing = await findOverallBudget(userId, year, month);
  if (existing) {
    await prisma.budget.update({
      where: { id: existing.id },
      data: { amount: amount.value },
    });
  } else {
    await prisma.budget.create({
      data: {
        userId,
        year,
        month,
        categoryId: null,
        amount: amount.value,
        currency: DEFAULT_CURRENCY,
      },
    });
  }

  revalidateBudgetPaths();
  return { success: "Overall budget saved." };
}

export async function upsertCategoryBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const userId = await requireUserId();

  const yearMonth = parseYearMonth(formData);
  if (!yearMonth.ok) {
    return { error: yearMonth.error };
  }
  const { year, month } = yearMonth;

  const categoryId = readString(formData.get("categoryId"));
  if (!categoryId) {
    return { error: "Category is required." };
  }

  const category = await assertCategoryOwned(categoryId, userId);
  if (!category) {
    return { error: "Category not found." };
  }

  const amount = parseBudgetAmount(readString(formData.get("amount")));
  if (!amount.ok) {
    return { error: amount.error };
  }

  await prisma.budget.upsert({
    where: {
      userId_year_month_categoryId: { userId, year, month, categoryId },
    },
    update: { amount: amount.value },
    create: {
      userId,
      year,
      month,
      categoryId,
      amount: amount.value,
      currency: DEFAULT_CURRENCY,
    },
  });

  revalidateBudgetPaths();
  return { success: "Category budget saved." };
}

export async function deleteBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const userId = await requireUserId();
  const id = readString(formData.get("id"));

  if (!id) {
    return { error: "Budget not found." };
  }

  const existing = await prisma.budget.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { error: "Budget not found." };
  }

  await prisma.budget.delete({
    where: { id },
  });

  revalidateBudgetPaths();
  return { success: "Budget deleted." };
}
