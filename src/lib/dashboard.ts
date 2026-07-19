import { DEFAULT_CURRENCY } from "@/lib/constants";
import {
  formatMonthLabel,
  spentAtMonthFilter,
  type YearMonth,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type CategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  /** Decimal total as string, e.g. "1234.50" */
  total: string;
  count: number;
  /** 0–100 share of month total; 0 if month total is 0 */
  percent: number;
};

export type MonthlyDashboard = {
  year: number;
  month: number;
  label: string;
  total: string;
  currency: string;
  expenseCount: number;
  byCategory: CategoryBreakdown[];
};

function decimalToNumber(value: { toString(): string } | null | undefined): number {
  if (value == null) {
    return 0;
  }
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(n: number): string {
  return n.toFixed(2);
}

/**
 * Monthly totals and category breakdown for one user.
 * Always scopes by userId and spentAt month range (gte / lt).
 */
export async function getMonthlyDashboard(
  userId: string,
  year: number,
  month: number,
): Promise<MonthlyDashboard> {
  const spentAt = spentAtMonthFilter(year, month);

  const [aggregate, grouped] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId, spentAt },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, spentAt },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const totalNumber = decimalToNumber(aggregate._sum.amount);
  const expenseCount = aggregate._count._all;

  const categoryIds = grouped.map((row) => row.categoryId);
  const categories =
    categoryIds.length === 0
      ? []
      : await prisma.category.findMany({
          where: { userId, id: { in: categoryIds } },
          select: { id: true, name: true },
        });

  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  const byCategory: CategoryBreakdown[] = grouped
    .map((row) => {
      const total = decimalToNumber(row._sum.amount);
      const percent =
        totalNumber > 0 ? Math.round((total / totalNumber) * 1000) / 10 : 0;

      return {
        categoryId: row.categoryId,
        categoryName: nameById.get(row.categoryId) ?? "Unknown",
        total: formatAmount(total),
        count: row._count._all,
        percent,
      };
    })
    .sort((a, b) => Number(b.total) - Number(a.total));

  return {
    year,
    month,
    label: formatMonthLabel(year, month),
    total: formatAmount(totalNumber),
    currency: DEFAULT_CURRENCY,
    expenseCount,
    byCategory,
  };
}

export async function getMonthlyDashboardFrom(
  userId: string,
  ym: YearMonth,
): Promise<MonthlyDashboard> {
  return getMonthlyDashboard(userId, ym.year, ym.month);
}
