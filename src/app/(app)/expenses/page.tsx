import { requireUserId } from "@/lib/auth-utils";
import { ensureDefaultCategories } from "@/lib/categories";

export default async function ExpensesPage() {
  const userId = await requireUserId();
  // Ensure defaults exist so create-expense (next) always has categories.
  await ensureDefaultCategories(userId);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Expenses
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        List and manage expenses will go here (Phase 2 §5). Default categories
        are seeded for your account when needed.
      </p>
    </div>
  );
}
