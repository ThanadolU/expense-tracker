import { formatMoney } from "@/lib/money";

type SummaryCardsProps = {
  monthLabel: string;
  total: string;
  currency: string;
  expenseCount: number;
};

export function SummaryCards({
  monthLabel,
  total,
  currency,
  expenseCount,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Month
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {monthLabel}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Total spent
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {formatMoney(total, currency)}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Expenses
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {expenseCount}
        </p>
      </div>
    </div>
  );
}
