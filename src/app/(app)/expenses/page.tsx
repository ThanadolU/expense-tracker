import { ExpenseCreateForm } from "@/components/expenses/expense-create-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseList } from "@/components/expenses/expense-list";
import { listExpensesForUser } from "@/lib/actions/expenses";
import { requireUserId } from "@/lib/auth-utils";
import { ensureDefaultCategories } from "@/lib/categories";
import {
  formatMonthLabelFrom,
  resolveExpenseMonthParam,
} from "@/lib/dates";
import { formatDateInput, todayDateInput } from "@/lib/money";
import {
  parsePaymentMethod,
  paymentMethodShortLabel,
} from "@/lib/payment-methods";

type ExpensesPageProps = {
  searchParams: Promise<{
    month?: string;
    categoryId?: string;
    paymentMethod?: string;
  }>;
};

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const userId = await requireUserId();
  const params = await searchParams;

  const yearMonth = resolveExpenseMonthParam(params.month);
  const categoryIdRaw =
    typeof params.categoryId === "string" && params.categoryId.trim()
      ? params.categoryId.trim()
      : null;
  const paymentMethod = parsePaymentMethod(params.paymentMethod);

  const categories = await ensureDefaultCategories(userId);
  const ownedCategoryIds = new Set(categories.map((c) => c.id));
  const categoryId =
    categoryIdRaw && ownedCategoryIds.has(categoryIdRaw)
      ? categoryIdRaw
      : null;

  const expenses = await listExpensesForUser(userId, {
    yearMonth,
    categoryId,
    paymentMethod,
  });

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
    paymentMethod: expense.paymentMethod,
  }));

  const today = todayDateInput();

  const isUnfiltered =
    yearMonth == null && categoryId == null && paymentMethod == null;

  const filterSummary = [
    yearMonth ? formatMonthLabelFrom(yearMonth) : "All months",
    categoryId
      ? (categories.find((c) => c.id === categoryId)?.name ?? "Category")
      : "All categories",
    paymentMethod
      ? paymentMethodShortLabel(paymentMethod)
      : "All methods",
  ].join(" · ");

  const emptyMessage = isUnfiltered
    ? "No expenses yet. Add one above to start tracking."
    : `No expenses for this filter (${filterSummary}).`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Expenses
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Record spending by category and payment method. Amounts use THB.
          Defaults to the current month.
        </p>
      </div>

      <ExpenseCreateForm categories={categoryOptions} defaultDate={today} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Filters
        </h2>
        <ExpenseFilters
          yearMonth={yearMonth}
          categoryId={categoryId}
          paymentMethod={paymentMethod}
          categories={categoryOptions}
          hasActiveFilters={!isUnfiltered}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Expenses ({expenseItems.length}
          {expenseItems.length >= 100 ? ", showing latest 100" : ""})
          <span className="ml-2 font-normal text-zinc-500">
            {filterSummary}
          </span>
        </h2>
        <ExpenseList
          expenses={expenseItems}
          categories={categoryOptions}
          emptyMessage={emptyMessage}
          showClearFilters={!isUnfiltered && expenseItems.length === 0}
        />
      </div>
    </div>
  );
}
