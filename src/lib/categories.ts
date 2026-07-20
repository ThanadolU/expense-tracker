import { prisma } from "@/lib/prisma";

/** Default category names seeded once per user when they have none. */
export const DEFAULT_CATEGORY_NAMES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Shopping",
  "Health",
  "Entertainment",
  "Other",
] as const;

/**
 * Ensures the user has at least the default categories.
 * Safe to call repeatedly — only inserts when the user has zero categories.
 * Returns the user's categories after ensuring defaults.
 */
export async function ensureDefaultCategories(userId: string) {
  const existingCount = await prisma.category.count({
    where: { userId },
  });

  if (existingCount === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORY_NAMES.map((name) => ({
        userId,
        name,
      })),
    });
  }

  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}
