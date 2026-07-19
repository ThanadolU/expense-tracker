import { requireUserId } from "@/lib/auth-utils";
import { ensureDefaultCategories } from "@/lib/categories";

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await ensureDefaultCategories(userId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Categories
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Manage categories will go here (Phase 2 §4). Defaults are ready for
          expenses.
        </p>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {categories.map((category) => (
          <li
            key={category.id}
            className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200"
          >
            {category.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
