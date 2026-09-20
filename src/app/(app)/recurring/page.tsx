import { RecurringList } from "@/components/recurring/recurring-list";
import { listRecurringExpensesForUser } from "@/lib/actions/recurring";
import { requireUserId } from "@/lib/auth-utils";
import { ensureDefaultCategories } from "@/lib/categories";
import { todayDateInput } from "@/lib/money";
import { processDueRecurringExpenses } from "@/lib/recurring";

export const metadata = {
  title: "Recurring Expenses — Expense Tracker",
};

export default async function RecurringPage() {
  const userId = await requireUserId();

  // Run auto-generation check whenever visiting the page
  await processDueRecurringExpenses(userId);

  const categories = await ensureDefaultCategories(userId);
  const recurringRaw = await listRecurringExpensesForUser(userId);

  const categoryOptions = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  const items = recurringRaw.map((item) => ({
    id: item.id,
    title: item.title,
    amount: item.amount.toString(),
    currency: item.currency,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    paymentMethod: item.paymentMethod,
    cadence: item.cadence,
    nextDueDate: item.nextDueDate.toISOString().slice(0, 10),
    isActive: item.isActive,
    note: item.note,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Recurring Expenses
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Scheduled templates for subscriptions, bills, and repeating costs. Expenses are auto-generated when due.
        </p>
      </div>

      <RecurringList
        items={items}
        categories={categoryOptions}
        defaultDate={todayDateInput()}
      />
    </div>
  );
}
