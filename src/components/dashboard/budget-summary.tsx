import Link from "next/link";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import type { BudgetSummary as BudgetSummaryData } from "@/lib/actions/budgets";

type BudgetSummaryProps = {
  summary: BudgetSummaryData;
  currency: string;
  monthParam: string;
};

/** Read-only "spent vs budget" for the dashboard. Only shows what's budgeted. */
export function BudgetSummary({
  summary,
  currency,
  monthParam,
}: BudgetSummaryProps) {
  const budgetedCategories = summary.categories.filter(
    (category) => category.amount !== null,
  );

  if (summary.overall.amount === null && budgetedCategories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Budgets
        </h2>
        <Link
          href={`/budgets?month=${monthParam}`}
          className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Manage
        </Link>
      </div>

      {summary.overall.amount !== null ? (
        <BudgetProgressBar
          spent={summary.overall.spent}
          amount={summary.overall.amount}
          currency={currency}
        />
      ) : null}

      {budgetedCategories.length > 0 ? (
        <div className="space-y-3">
          {budgetedCategories.map((category) => (
            <div key={category.categoryId} className="space-y-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {category.categoryName}
              </span>
              <BudgetProgressBar
                spent={category.spent}
                amount={category.amount as string}
                currency={currency}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
