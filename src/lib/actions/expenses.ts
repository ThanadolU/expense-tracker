"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { spentAtMonthFilter } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type ExpenseFormState = {
  error?: string;
  success?: string;
} | null;

const MAX_NOTE_LENGTH = 500;
const LIST_LIMIT = 100;

function revalidateExpensePaths() {
  revalidatePath("/expenses");
  revalidatePath("/categories");
  revalidatePath("/dashboard");
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(raw: string): { ok: true; value: string } | { ok: false; error: string } {
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

function parseSpentAt(raw: string): { ok: true; value: Date } | { ok: false; error: string } {
  if (!raw) {
    return { ok: false, error: "Date is required." };
  }
  // HTML date input: YYYY-MM-DD → store as UTC date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: "Enter a valid date." };
  }
  const value = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(value.getTime())) {
    return { ok: false, error: "Enter a valid date." };
  }
  return { ok: true, value };
}

async function assertCategoryOwned(categoryId: string, userId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
}

export async function createExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const userId = await requireUserId();

  const amountRaw = readString(formData.get("amount"));
  const spentAtRaw = readString(formData.get("spentAt"));
  const categoryId = readString(formData.get("categoryId"));
  const noteRaw = readString(formData.get("note"));

  const amount = parseAmount(amountRaw);
  if (!amount.ok) {
    return { error: amount.error };
  }

  const spentAt = parseSpentAt(spentAtRaw);
  if (!spentAt.ok) {
    return { error: spentAt.error };
  }

  if (!categoryId) {
    return { error: "Category is required." };
  }

  const category = await assertCategoryOwned(categoryId, userId);
  if (!category) {
    return { error: "Category not found." };
  }

  if (noteRaw.length > MAX_NOTE_LENGTH) {
    return { error: `Note must be at most ${MAX_NOTE_LENGTH} characters.` };
  }

  await prisma.expense.create({
    data: {
      userId,
      categoryId,
      amount: amount.value,
      currency: DEFAULT_CURRENCY,
      spentAt: spentAt.value,
      note: noteRaw.length > 0 ? noteRaw : null,
    },
  });

  revalidateExpensePaths();
  return { success: "Expense added." };
}

export async function updateExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const userId = await requireUserId();
  const id = readString(formData.get("id"));

  if (!id) {
    return { error: "Expense not found." };
  }

  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { error: "Expense not found." };
  }

  const amountRaw = readString(formData.get("amount"));
  const spentAtRaw = readString(formData.get("spentAt"));
  const categoryId = readString(formData.get("categoryId"));
  const noteRaw = readString(formData.get("note"));

  const amount = parseAmount(amountRaw);
  if (!amount.ok) {
    return { error: amount.error };
  }

  const spentAt = parseSpentAt(spentAtRaw);
  if (!spentAt.ok) {
    return { error: spentAt.error };
  }

  if (!categoryId) {
    return { error: "Category is required." };
  }

  const category = await assertCategoryOwned(categoryId, userId);
  if (!category) {
    return { error: "Category not found." };
  }

  if (noteRaw.length > MAX_NOTE_LENGTH) {
    return { error: `Note must be at most ${MAX_NOTE_LENGTH} characters.` };
  }

  await prisma.expense.update({
    where: { id },
    data: {
      categoryId,
      amount: amount.value,
      spentAt: spentAt.value,
      note: noteRaw.length > 0 ? noteRaw : null,
    },
  });

  revalidateExpensePaths();
  return { success: "Expense updated." };
}

export async function deleteExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const userId = await requireUserId();
  const id = readString(formData.get("id"));

  if (!id) {
    return { error: "Expense not found." };
  }

  const existing = await prisma.expense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { error: "Expense not found." };
  }

  await prisma.expense.delete({
    where: { id },
  });

  revalidateExpensePaths();
  return { success: "Expense deleted." };
}

export type ListExpensesFilters = {
  /** null = all months */
  yearMonth?: { year: number; month: number } | null;
  /** null/undefined = all categories; only applied if owned by user */
  categoryId?: string | null;
};

export async function listExpensesForUser(
  userId: string,
  filters: ListExpensesFilters = {},
) {
  const where: {
    userId: string;
    spentAt?: { gte: Date; lt: Date };
    categoryId?: string;
  } = { userId };

  if (filters.yearMonth) {
    where.spentAt = spentAtMonthFilter(
      filters.yearMonth.year,
      filters.yearMonth.month,
    );
  }

  if (filters.categoryId) {
    const owned = await assertCategoryOwned(filters.categoryId, userId);
    if (owned) {
      where.categoryId = filters.categoryId;
    }
  }

  return prisma.expense.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
    take: LIST_LIMIT,
  });
}
