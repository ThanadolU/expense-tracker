import { ExpenseCreateForm } from "@/components/expenses/expense-create-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseList } from "@/components/expenses/expense-list";
import { listExpensesForUser } from "@/lib/actions/expenses";
import { requireUserId } from "@/lib/auth-utils";
import { ensureDefaultCategories } from "@/lib/categories";
import {
  formatMonthLabelFrom,
  resolveExpenseMonthParam,
  toMonthInputValueFrom,
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

  const exportParams = new URLSearchParams();
  if (params.month) {
    exportParams.set("month", params.month);
  } else if (yearMonth) {
    exportParams.set("month", toMonthInputValueFrom(yearMonth));
  }
  if (categoryId) {
    exportParams.set("categoryId", categoryId);
  }
  if (paymentMethod) {
    exportParams.set("paymentMethod", paymentMethod);
  }
  const exportQuery = exportParams.toString();
  const exportHref = `/api/expenses/export${exportQuery ? `?${exportQuery}` : ""}`;

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Expenses
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Record spending by category and payment method. Amounts use THB.
            Defaults to the current month.
          </p>
        </div>
        <a
          href={exportHref}
          download
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-900 sm:self-start dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export CSV
        </a>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Expenses ({expenseItems.length}
            {expenseItems.length >= 100 ? ", showing latest 100" : ""})
            <span className="ml-2 font-normal text-zinc-500">
              {filterSummary}
            </span>
          </h2>
          <a
            href={exportHref}
            download
            className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Export CSV
          </a>
        </div>
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
