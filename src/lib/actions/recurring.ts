"use server";

import { revalidatePath } from "next/cache";
import { RecurringCadence } from "@/generated/prisma/client";
import { requireUserId } from "@/lib/auth-utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import {
  DEFAULT_PAYMENT_METHOD,
  parsePaymentMethod,
  type PaymentMethodId,
} from "@/lib/payment-methods";
import { prisma } from "@/lib/prisma";
import { processDueRecurringExpenses } from "@/lib/recurring";

export type RecurringFormState = {
  error?: string;
  success?: string;
} | null;

const MAX_TITLE_LENGTH = 100;
const MAX_NOTE_LENGTH = 500;

function revalidateAllPaths() {
  revalidatePath("/recurring");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  if (!raw) {
    return { ok: false, error: "Amount is required." };
  }
  const normalized = raw.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return {
      ok: false,
      error: "Enter a valid amount with up to 2 decimal places.",
    };
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (n >= 1_000_000_000_000) {
    return { ok: false, error: "Amount is too large." };
  }
  return { ok: true, value: normalized };
}

function parseDateInput(raw: string): { ok: true; value: Date } | { ok: false; error: string } {
  if (!raw) {
    return { ok: false, error: "Date is required." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: "Enter a valid date." };
  }
  const value = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(value.getTime())) {
    return { ok: false, error: "Enter a valid date." };
  }
  return { ok: true, value };
}

function parseCadence(raw: string): RecurringCadence {
  switch (raw.toUpperCase()) {
    case "DAILY":
      return "DAILY";
    case "WEEKLY":
      return "WEEKLY";
    case "YEARLY":
      return "YEARLY";
    case "MONTHLY":
    default:
      return "MONTHLY";
  }
}

function resolvePaymentMethod(
  raw: string,
): { ok: true; value: PaymentMethodId } | { ok: false; error: string } {
  if (!raw) {
    return { ok: true, value: DEFAULT_PAYMENT_METHOD };
  }
  const parsed = parsePaymentMethod(raw);
  if (!parsed) {
    return { ok: false, error: "Invalid payment method." };
  }
  return { ok: true, value: parsed };
}

export async function listRecurringExpensesForUser(userId: string) {
  return prisma.recurringExpense.findMany({
    where: { userId },
    include: {
      category: true,
      _count: {
        select: { expenses: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { nextDueDate: "asc" }],
  });
}

export async function createRecurringExpenseAction(
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const userId = await requireUserId();

  const title = readString(formData.get("title"));
  const amountRaw = readString(formData.get("amount"));
  const categoryId = readString(formData.get("categoryId"));
  const paymentMethodRaw = readString(formData.get("paymentMethod"));
  const cadenceRaw = readString(formData.get("cadence"));
  const nextDueDateRaw = readString(formData.get("nextDueDate"));
  const noteRaw = readString(formData.get("note"));

  if (!title) {
    return { error: "Title is required." };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be at most ${MAX_TITLE_LENGTH} characters.` };
  }

  const amount = parseAmount(amountRaw);
  if (!amount.ok) {
    return { error: amount.error };
  }

  if (!categoryId) {
    return { error: "Category is required." };
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!category) {
    return { error: "Category not found." };
  }

  const paymentMethod = resolvePaymentMethod(paymentMethodRaw);
  if (!paymentMethod.ok) {
    return { error: paymentMethod.error };
  }

  const nextDueDate = parseDateInput(nextDueDateRaw);
  if (!nextDueDate.ok) {
    return { error: nextDueDate.error };
  }

  if (noteRaw.length > MAX_NOTE_LENGTH) {
    return { error: `Note must be at most ${MAX_NOTE_LENGTH} characters.` };
  }

  const cadence = parseCadence(cadenceRaw);

  await prisma.recurringExpense.create({
    data: {
      userId,
      title,
      amount: amount.value,
      currency: DEFAULT_CURRENCY,
      categoryId,
      paymentMethod: paymentMethod.value,
      cadence,
      startDate: nextDueDate.value,
      nextDueDate: nextDueDate.value,
      note: noteRaw.length > 0 ? noteRaw : null,
      isActive: true,
    },
  });

  // Check and generate immediately if nextDueDate <= today
  await processDueRecurringExpenses(userId);

  revalidateAllPaths();
  return { success: "Recurring expense created." };
}

export async function updateRecurringExpenseAction(
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const userId = await requireUserId();
  const id = readString(formData.get("id"));

  if (!id) {
    return { error: "Recurring expense not found." };
  }

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { error: "Recurring expense not found." };
  }

  const title = readString(formData.get("title"));
  const amountRaw = readString(formData.get("amount"));
  const categoryId = readString(formData.get("categoryId"));
  const paymentMethodRaw = readString(formData.get("paymentMethod"));
  const cadenceRaw = readString(formData.get("cadence"));
  const nextDueDateRaw = readString(formData.get("nextDueDate"));
  const noteRaw = readString(formData.get("note"));

  if (!title) {
    return { error: "Title is required." };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be at most ${MAX_TITLE_LENGTH} characters.` };
  }

  const amount = parseAmount(amountRaw);
  if (!amount.ok) {
    return { error: amount.error };
  }

  if (!categoryId) {
    return { error: "Category is required." };
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!category) {
    return { error: "Category not found." };
  }

  const paymentMethod = resolvePaymentMethod(paymentMethodRaw);
  if (!paymentMethod.ok) {
    return { error: paymentMethod.error };
  }

  const nextDueDate = parseDateInput(nextDueDateRaw);
  if (!nextDueDate.ok) {
    return { error: nextDueDate.error };
  }

  if (noteRaw.length > MAX_NOTE_LENGTH) {
    return { error: `Note must be at most ${MAX_NOTE_LENGTH} characters.` };
  }

  const cadence = parseCadence(cadenceRaw);

  await prisma.recurringExpense.update({
    where: { id },
    data: {
      title,
      amount: amount.value,
      categoryId,
      paymentMethod: paymentMethod.value,
      cadence,
      nextDueDate: nextDueDate.value,
      note: noteRaw.length > 0 ? noteRaw : null,
    },
  });

  // Check and generate if nextDueDate <= today
  await processDueRecurringExpenses(userId);

  revalidateAllPaths();
  return { success: "Recurring expense updated." };
}

export async function toggleRecurringExpenseActiveAction(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireUserId();

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { success: false, error: "Recurring expense not found." };
  }

  await prisma.recurringExpense.update({
    where: { id },
    data: { isActive },
  });

  if (isActive) {
    await processDueRecurringExpenses(userId);
  }

  revalidateAllPaths();
  return { success: true };
}

export async function deleteRecurringExpenseAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await requireUserId();

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return { success: false, error: "Recurring expense not found." };
  }

  await prisma.recurringExpense.delete({
    where: { id },
  });

  revalidateAllPaths();
  return { success: true };
}

export async function triggerRecurringProcessAction(): Promise<{
  success: boolean;
  generatedCount: number;
}> {
  const userId = await requireUserId();
  const result = await processDueRecurringExpenses(userId);
  if (result.generatedCount > 0) {
    revalidateAllPaths();
  }
  return { success: true, generatedCount: result.generatedCount };
}
