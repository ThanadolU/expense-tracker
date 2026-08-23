"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteBudgetAction,
  upsertCategoryBudgetAction,
  type BudgetFormState,
} from "@/lib/actions/budgets";
import { formatMoney } from "@/lib/money";
import { BudgetProgressBar } from "./budget-progress-bar";

export type BudgetCategoryItem = {
  categoryId: string;
  categoryName: string;
  id: string | null;
  amount: string | null;
  spent: string;
};

type BudgetCategoryRowProps = {
  year: number;
  month: number;
  currency: string;
  item: BudgetCategoryItem;
};

const initialState: BudgetFormState = null;

export function BudgetCategoryRow({
  year,
  month,
  currency,
  item,
}: BudgetCategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    upsertCategoryBudgetAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBudgetAction,
    initialState,
  );

  useEffect(() => {
    if (updateState?.success) {
      setEditing(false);
    }
  }, [updateState?.success]);

  const error = updateState?.error || deleteState?.error;
  const pending = updatePending || deletePending;
  const hasBudget = item.amount !== null;

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {item.categoryName}
        </span>
        {!editing ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(true)}
              className="inline-flex min-h-9 items-center rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {hasBudget ? "Edit" : "Set budget"}
            </button>
            {hasBudget ? (
              <form
                action={deleteAction}
                onSubmit={(event) => {
                  if (
                    !confirm(
                      `Remove the budget for “${item.categoryName}” this month?`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={item.id ?? ""} />
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex min-h-9 items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  {deletePending ? "Removing…" : "Remove"}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {editing ? (
        <form action={updateAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="categoryId" value={item.categoryId} />
          <div className="min-w-0 flex-1 space-y-1">
            <label
              htmlFor={`amount-${item.categoryId}`}
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Budget ({currency})
            </label>
            <input
              id={`amount-${item.categoryId}`}
              name="amount"
              type="text"
              inputMode="decimal"
              required
              autoFocus
              defaultValue={item.amount ?? ""}
              placeholder="0.00"
              className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-10 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {updatePending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
              className="min-h-10 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : hasBudget ? (
        <BudgetProgressBar
          spent={item.spent}
          amount={item.amount as string}
          currency={currency}
        />
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No budget set. Spent so far: {formatMoney(item.spent, currency)}.
        </p>
      )}
    </li>
  );
}
