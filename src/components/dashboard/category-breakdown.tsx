import type { CategoryBreakdown as CategoryBreakdownRow } from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";

type CategoryBreakdownProps = {
  rows: CategoryBreakdownRow[];
  currency: string;
};

export function CategoryBreakdown({ rows, currency }: CategoryBreakdownProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        By category
      </h2>

      {/* CSS bar chart — no extra dependency */}
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((row) => (
          <div key={row.categoryId} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                {row.categoryName}
              </span>
              <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                {formatMoney(row.total, currency)} ({row.percent}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{ width: `${Math.min(100, Math.max(0, row.percent))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Amount</th>
              <th className="px-4 py-2.5 font-medium">Share</th>
              <th className="px-4 py-2.5 font-medium">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr key={row.categoryId}>
                <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-50">
                  {row.categoryName}
                </td>
                <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                  {formatMoney(row.total, currency)}
                </td>
                <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                  {row.percent}%
                </td>
                <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
