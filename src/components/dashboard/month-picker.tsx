import { toMonthInputValue } from "@/lib/dates";

type MonthPickerProps = {
  year: number;
  month: number;
  /** Path to submit GET form to (default dashboard). */
  action?: string;
};

/**
 * GET form that sets `?month=YYYY-MM` for server-rendered filtering.
 */
export function MonthPicker({
  year,
  month,
  action = "/dashboard",
}: MonthPickerProps) {
  return (
    <form
      method="get"
      action={action}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-1">
        <label
          htmlFor="month"
          className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Month
        </label>
        <input
          id="month"
          name="month"
          type="month"
          required
          defaultValue={toMonthInputValue(year, month)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Apply
      </button>
    </form>
  );
}
