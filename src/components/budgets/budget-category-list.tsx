import { BudgetCategoryRow, type BudgetCategoryItem } from "./budget-category-row";

type BudgetCategoryListProps = {
  year: number;
  month: number;
  currency: string;
  items: BudgetCategoryItem[];
};

export function BudgetCategoryList({
  year,
  month,
  currency,
  items,
}: BudgetCategoryListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        Add a category first to set category budgets.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {items.map((item) => (
        <BudgetCategoryRow
          key={item.categoryId}
          year={year}
          month={month}
          currency={currency}
          item={item}
        />
      ))}
    </ul>
  );
}
