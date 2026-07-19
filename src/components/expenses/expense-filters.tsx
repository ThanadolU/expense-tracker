import Link from "next/link";
import {
  formatMonthLabelFrom,
  recentYearMonths,
  toMonthInputValueFrom,
  type YearMonth,
} from "@/lib/dates";

export type CategoryOption = {
  id: string;
  name: string;
};

type ExpenseFiltersProps = {
  /** null = all months */
  yearMonth: YearMonth | null;
  categoryId: string | null;
  categories: CategoryOption[];
  hasActiveFilters: boolean;
};

export function ExpenseFilters({
  yearMonth,
  categoryId,
  categories,
  hasActiveFilters,
}: ExpenseFiltersProps) {
  const monthOptions = recentYearMonths(24);
  const monthSelectValue = yearMonth
    ? toMonthInputValueFrom(yearMonth)
    : "all";

  return (
    <form
      method="get"
      action="/expenses"
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="space-y-1">
        <label
          htmlFor="filter-month"
          className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Month
        </label>
        <select
          id="filter-month"
          name="month"
          defaultValue={monthSelectValue}
          className="min-w-[10rem] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          <option value="all">All months</option>
          {monthOptions.map((ym) => {
            const value = toMonthInputValueFrom(ym);
            return (
              <option key={value} value={value}>
                {formatMonthLabelFrom(ym)}
              </option>
            );
          })}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="filter-category"
          className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Category
        </label>
        <select
          id="filter-category"
          name="categoryId"
          defaultValue={categoryId ?? ""}
          className="min-w-[10rem] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Apply
        </button>
        {hasActiveFilters ? (
          <Link
            href="/expenses?month=all"
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
