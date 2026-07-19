import Link from "next/link";

type EmptyMonthProps = {
  monthLabel: string;
};

export function EmptyMonth({ monthLabel }: EmptyMonthProps) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        No expenses this month
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Nothing recorded for {monthLabel} yet.
      </p>
      <Link
        href="/expenses"
        className="mt-4 inline-flex rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Add an expense
      </Link>
    </div>
  );
}
