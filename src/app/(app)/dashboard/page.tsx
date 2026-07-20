import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { EmptyMonth } from "@/components/dashboard/empty-month";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { requireUserId } from "@/lib/auth-utils";
import { getMonthlyDashboardFrom } from "@/lib/dashboard";
import { resolveYearMonth } from "@/lib/dates";

type DashboardPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const userId = await requireUserId();
  const params = await searchParams;
  const ym = resolveYearMonth(params.month);
  const dashboard = await getMonthlyDashboardFrom(userId, ym);

  const isEmpty = dashboard.expenseCount === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            How much you spent this month, and on what.
          </p>
        </div>
        <MonthPicker year={dashboard.year} month={dashboard.month} />
      </div>

      <SummaryCards
        monthLabel={dashboard.label}
        total={dashboard.total}
        currency={dashboard.currency}
        expenseCount={dashboard.expenseCount}
      />

      {isEmpty ? (
        <EmptyMonth monthLabel={dashboard.label} />
      ) : (
        <CategoryBreakdown
          rows={dashboard.byCategory}
          currency={dashboard.currency}
        />
      )}
    </div>
  );
}
