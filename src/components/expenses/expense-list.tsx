import Link from "next/link";
import {
  ExpenseRow,
  type ExpenseListItem,
} from "@/components/expenses/expense-row";
import type { CategoryOption } from "@/components/expenses/expense-create-form";

type ExpenseListProps = {
  expenses: ExpenseListItem[];
  categories: CategoryOption[];
  /** When filters match nothing vs truly no expenses */
  emptyMessage?: string;
  showClearFilters?: boolean;
};

export function ExpenseList({
  expenses,
  categories,
  emptyMessage = "No expenses yet. Add one above to start tracking.",
  showClearFilters = false,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
        {showClearFilters ? (
          <Link
            href="/expenses?month=all"
            className="mt-3 inline-flex text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {expenses.map((expense) => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          categories={categories}
        />
      ))}
    </ul>
  );
}
