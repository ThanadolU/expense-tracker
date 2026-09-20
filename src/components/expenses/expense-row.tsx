"use client";

import { useActionState, useState } from "react";
import {
  deleteExpenseAction,
  updateExpenseAction,
  type ExpenseFormState,
} from "@/lib/actions/expenses";
import type { CategoryOption } from "@/components/expenses/expense-create-form";
import { PaymentMethodIcon } from "@/components/expenses/payment-method-icon";
import { ReceiptModal } from "@/components/expenses/receipt-modal";
import { ReceiptUploadInput } from "@/components/expenses/receipt-upload-input";
import { formatDateInput, formatMoney } from "@/lib/money";
import {
  PAYMENT_METHODS,
  paymentMethodShortLabel,
  type PaymentMethodId,
} from "@/lib/payment-methods";

export type ExpenseListItem = {
  id: string;
  amount: string;
  currency: string;
  spentAt: string;
  note: string | null;
  categoryId: string;
  categoryName: string;
  paymentMethod: PaymentMethodId | string;
  recurringExpenseId?: string | null;
  receiptUrl?: string | null;
  receiptKey?: string | null;
};

const initialState: ExpenseFormState = null;

type ExpenseRowProps = {
  expense: ExpenseListItem;
  categories: CategoryOption[];
};

export function ExpenseRow({ expense, categories }: ExpenseRowProps) {
  const [editing, setEditing] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateExpenseAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteExpenseAction,
    initialState,
  );

  const [prevUpdateState, setPrevUpdateState] = useState(updateState);
  if (updateState !== prevUpdateState) {
    setPrevUpdateState(updateState);
    if (updateState?.success) {
      setEditing(false);
    }
  }

  const error = updateState?.error || deleteState?.error;
  const success = updateState?.success || deleteState?.success;
  const pending = updatePending || deletePending;

  return (
    <li className="space-y-2 px-4 py-3">
      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success && !editing ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          {success}
        </p>
      ) : null}

      {editing ? (
        <form action={updateAction} className="space-y-3">
          <input type="hidden" name="id" value={expense.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Amount
              </label>
              <input
                name="amount"
                type="text"
                inputMode="decimal"
                required
                defaultValue={expense.amount}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Date
              </label>
              <input
                name="spentAt"
                type="date"
                required
                defaultValue={expense.spentAt}
                className="date-input block w-full max-w-full min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Category
              </label>
              <select
                name="categoryId"
                required
                defaultValue={expense.categoryId}
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Payment method
              </label>
              <select
                name="paymentMethod"
                required
                defaultValue={expense.paymentMethod}
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Note
              </label>
              <input
                name="note"
                type="text"
                maxLength={500}
                defaultValue={expense.note ?? ""}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="min-w-0 space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Receipt
              </label>
              <ReceiptUploadInput
                existingReceiptUrl={
                  expense.receiptKey
                    ? expense.receiptUrl || `/api/receipts/${expense.id}`
                    : null
                }
                disabled={pending}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {updatePending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatMoney(expense.amount, expense.currency)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDateInput(expense.spentAt)}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {expense.categoryName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PaymentMethodIcon method={expense.paymentMethod} />
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {paymentMethodShortLabel(expense.paymentMethod)}
                </span>
              </span>
              {expense.recurringExpenseId ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  title="Auto-generated from recurring expense template"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Recurring
                </span>
              ) : null}
              {expense.receiptKey ? (
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  title="View attached receipt"
                >
                  <svg
                    className="h-3 w-3 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  Receipt
                </button>
              ) : null}
            </div>
            {expense.note ? (
              <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                {expense.note}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(true)}
              className="inline-flex min-h-10 items-center rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit
            </button>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!confirm("Delete this expense? This cannot be undone.")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={expense.id} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-10 items-center rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {deletePending ? "Deleting…" : "Delete"}
              </button>
            </form>
          </div>
        </div>
      )}

      {expense.receiptKey ? (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          receiptUrl={expense.receiptUrl || `/api/receipts/${expense.id}`}
          title={`Receipt: ${expense.note || expense.categoryName} (${formatMoney(expense.amount, expense.currency)})`}
        />
      ) : null}
    </li>
  );
}
