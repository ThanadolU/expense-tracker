"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteExpenseAction,
  updateExpenseAction,
  type ExpenseFormState,
} from "@/lib/actions/expenses";
import type { CategoryOption } from "@/components/expenses/expense-create-form";
import { formatDateInput, formatMoney } from "@/lib/money";

export type ExpenseListItem = {
  id: string;
  amount: string;
  currency: string;
  spentAt: string;
  note: string | null;
  categoryId: string;
  categoryName: string;
};

const initialState: ExpenseFormState = null;

type ExpenseRowProps = {
  expense: ExpenseListItem;
  categories: CategoryOption[];
};

export function ExpenseRow({ expense, categories }: ExpenseRowProps) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateExpenseAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteExpenseAction,
    initialState,
  );

  useEffect(() => {
    if (updateState?.success) {
      setEditing(false);
    }
  }, [updateState?.success]);

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
            <div className="space-y-1">
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
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Date
              </label>
              <input
                name="spentAt"
                type="date"
                required
                defaultValue={expense.spentAt}
                className="date-input w-full min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Category
              </label>
              <select
                name="categoryId"
                required
                defaultValue={expense.categoryId}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
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
    </li>
  );
}
