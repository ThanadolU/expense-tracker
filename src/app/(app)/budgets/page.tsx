import { BudgetCategoryList } from "@/components/budgets/budget-category-list";
import { BudgetOverallCard } from "@/components/budgets/budget-overall-card";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { getBudgetSummaryForMonth } from "@/lib/actions/budgets";
import { requireUserId } from "@/lib/auth-utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { formatMonthLabelFrom, resolveYearMonth } from "@/lib/dates";

type BudgetsPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const userId = await requireUserId();
  const params = await searchParams;
  const ym = resolveYearMonth(params.month);
  const summary = await getBudgetSummaryForMonth(userId, ym.year, ym.month);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Budgets
          </h1>
          <p className="w-[32vw] text-sm text-zinc-600 dark:text-zinc-400">
            Optional caps for {formatMonthLabelFrom(ym)}. Going over just
            shows a warning — nothing blocks you from adding an expense.
          </p>
        </div>
        <MonthPicker year={ym.year} month={ym.month} action="/budgets" />
      </div>

      <BudgetOverallCard
        year={ym.year}
        month={ym.month}
        currency={DEFAULT_CURRENCY}
        id={summary.overall.id}
        amount={summary.overall.amount}
        spent={summary.overall.spent}
      />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          By category
        </h2>
        <BudgetCategoryList
          year={ym.year}
          month={ym.month}
          currency={DEFAULT_CURRENCY}
          items={summary.categories}
        />
      </div>
    </div>
  );
}
