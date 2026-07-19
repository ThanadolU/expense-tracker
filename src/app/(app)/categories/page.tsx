import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { CategoryList } from "@/components/categories/category-list";
import { requireUserId } from "@/lib/auth-utils";
import { ensureDefaultCategories } from "@/lib/categories";

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await ensureDefaultCategories(userId);

  const items = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Categories
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Organize expenses with categories. You cannot delete a category that
          still has expenses.
        </p>
      </div>

      <CategoryCreateForm />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Your categories ({items.length})
        </h2>
        <CategoryList categories={items} />
      </div>
    </div>
  );
}
