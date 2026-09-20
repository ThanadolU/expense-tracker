import { BudgetSummary } from "@/components/dashboard/budget-summary";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DailySpendLineChart } from "@/components/dashboard/daily-spend-line-chart";
import { EmptyMonth } from "@/components/dashboard/empty-month";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { getBudgetSummaryForMonth } from "@/lib/actions/budgets";
import { requireUserId } from "@/lib/auth-utils";
import { getMonthlyDashboardFrom } from "@/lib/dashboard";
import { resolveYearMonth, toMonthInputValueFrom } from "@/lib/dates";

type DashboardPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const userId = await requireUserId();
  const params = await searchParams;
  const ym = resolveYearMonth(params.month);
  const [dashboard, budgetSummary] = await Promise.all([
    getMonthlyDashboardFrom(userId, ym),
    getBudgetSummaryForMonth(userId, ym.year, ym.month),
  ]);

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

      <BudgetSummary
        summary={budgetSummary}
        currency={dashboard.currency}
        monthParam={toMonthInputValueFrom(ym)}
      />

      {isEmpty ? (
        <EmptyMonth monthLabel={dashboard.label} />
      ) : (
        <>
          <DailySpendLineChart
            data={dashboard.dailySpend}
            currency={dashboard.currency}
            monthLabel={dashboard.label}
          />
          <CategoryBreakdown
            rows={dashboard.byCategory}
            currency={dashboard.currency}
          />
        </>
      )}
    </div>
  );
}
