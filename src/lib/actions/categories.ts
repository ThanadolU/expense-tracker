"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export type CategoryFormState = {
  error?: string;
  success?: string;
} | null;

const MAX_NAME_LENGTH = 50;

function normalizeName(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateName(name: string): string | null {
  if (!name) {
    return "Name is required.";
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  }
  return null;
}

function revalidateCategoryPaths() {
  revalidatePath("/categories");
  revalidatePath("/expenses");
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const userId = await requireUserId();
  const name = normalizeName(formData.get("name"));

  const validationError = validateName(name);
  if (validationError) {
    return { error: validationError };
  }

  const duplicate = await prisma.category.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) {
    return { error: "A category with this name already exists." };
  }

  await prisma.category.create({
    data: { userId, name },
  });

  revalidateCategoryPaths();
  return { success: "Category created." };
}

export async function updateCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const userId = await requireUserId();
  const id = typeof formData.get("id") === "string" ? formData.get("id") as string : "";
  const name = normalizeName(formData.get("name"));

  if (!id) {
    return { error: "Category not found." };
  }

  const validationError = validateName(name);
  if (validationError) {
    return { error: validationError };
  }

  const existing = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { error: "Category not found." };
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      NOT: { id },
    },
  });
  if (duplicate) {
    return { error: "A category with this name already exists." };
  }

  await prisma.category.update({
    where: { id },
    data: { name },
  });

  revalidateCategoryPaths();
  return { success: "Category updated." };
}

export async function deleteCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const userId = await requireUserId();
  const id = typeof formData.get("id") === "string" ? formData.get("id") as string : "";

  if (!id) {
    return { error: "Category not found." };
  }

  const existing = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { error: "Category not found." };
  }

  const expenseCount = await prisma.expense.count({
    where: { categoryId: id, userId },
  });
  if (expenseCount > 0) {
    return {
      error: "Category is in use by expenses. Remove or reassign those expenses first.",
    };
  }

  await prisma.category.delete({
    where: { id },
  });

  revalidateCategoryPaths();
  return { success: "Category deleted." };
}
