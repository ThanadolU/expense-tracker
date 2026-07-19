import { ExpenseCreateForm } from "@/components/expenses/expense-create-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import { listExpensesForUser } from "@/lib/actions/expenses";
import { requireUserId } from "@/lib/auth-utils";
import { ensureDefaultCategories } from "@/lib/categories";
import { formatDateInput, todayDateInput } from "@/lib/money";

export default async function ExpensesPage() {
  const userId = await requireUserId();
  const categories = await ensureDefaultCategories(userId);
  const expenses = await listExpensesForUser(userId);

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const expenseItems = expenses.map((expense) => ({
    id: expense.id,
    amount: expense.amount.toString(),
    currency: expense.currency,
    spentAt: formatDateInput(expense.spentAt),
    note: expense.note,
    categoryId: expense.categoryId,
    categoryName: expense.category.name,
  }));

  const today = todayDateInput();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Expenses
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Record spending by category. Amounts use THB for this MVP.
        </p>
      </div>

      <ExpenseCreateForm categories={categoryOptions} defaultDate={today} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent expenses ({expenseItems.length}
          {expenseItems.length >= 100 ? ", showing latest 100" : ""})
        </h2>
        <ExpenseList expenses={expenseItems} categories={categoryOptions} />
      </div>
    </div>
  );
}
