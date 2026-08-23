import { formatMoney } from "@/lib/money";

type BudgetProgressBarProps = {
  /** Decimal string, e.g. "123.45" */
  spent: string;
  /** Decimal string, e.g. "500.00" */
  amount: string;
  currency: string;
};

/** Spent vs budget bar. Amber near the limit, red once over (no hard block). */
export function BudgetProgressBar({
  spent,
  amount,
  currency,
}: BudgetProgressBarProps) {
  const spentNumber = Number(spent);
  const amountNumber = Number(amount);
  const percent =
    amountNumber > 0 ? (spentNumber / amountNumber) * 100 : 0;
  const remaining = amountNumber - spentNumber;
  const over = remaining < 0;

  const barColor =
    percent >= 100
      ? "bg-red-600 dark:bg-red-500"
      : percent >= 80
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-emerald-600 dark:bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">
          {formatMoney(spent, currency)} of {formatMoney(amount, currency)}
        </span>
        <span
          className={
            over
              ? "font-medium text-red-600 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }
        >
          {over
            ? `${formatMoney(Math.abs(remaining), currency)} over`
            : `${formatMoney(remaining, currency)} left`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
