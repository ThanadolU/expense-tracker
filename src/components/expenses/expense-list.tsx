import {
  ExpenseRow,
  type ExpenseListItem,
} from "@/components/expenses/expense-row";
import type { CategoryOption } from "@/components/expenses/expense-create-form";

type ExpenseListProps = {
  expenses: ExpenseListItem[];
  categories: CategoryOption[];
};

export function ExpenseList({ expenses, categories }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No expenses yet. Add one above to start tracking.
      </p>
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
