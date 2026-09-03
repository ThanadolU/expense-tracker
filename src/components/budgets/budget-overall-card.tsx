"use client";

import { useActionState, useState } from "react";
import {
  deleteBudgetAction,
  upsertOverallBudgetAction,
  type BudgetFormState,
} from "@/lib/actions/budgets";
import { formatMoney } from "@/lib/money";
import { BudgetProgressBar } from "./budget-progress-bar";

type BudgetOverallCardProps = {
  year: number;
  month: number;
  currency: string;
  id: string | null;
  amount: string | null;
  spent: string;
};

const initialState: BudgetFormState = null;

export function BudgetOverallCard({
  year,
  month,
  currency,
  id,
  amount,
  spent,
}: BudgetOverallCardProps) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    upsertOverallBudgetAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBudgetAction,
    initialState,
  );

  // Close the edit form once the update succeeds. Compared during render
  // (not in an effect) so closing happens in the same commit as the new
  // state, instead of an extra render-then-effect pass.
  const [prevUpdateState, setPrevUpdateState] = useState(updateState);
  if (updateState !== prevUpdateState) {
    setPrevUpdateState(updateState);
    if (updateState?.success) {
      setEditing(false);
    }
  }

  const error = updateState?.error || deleteState?.error;
  const pending = updatePending || deletePending;

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Overall budget
        </h2>
        {!editing && amount !== null ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(true)}
              className="inline-flex min-h-9 items-center rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit
            </button>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!confirm("Remove the overall budget for this month?")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={id ?? ""} />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-9 items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {deletePending ? "Removing…" : "Remove"}
              </button>
            </form>
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
          <div className="min-w-0 flex-1 space-y-1">
            <label
              htmlFor="overall-amount"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Monthly cap ({currency})
            </label>
            <input
              id="overall-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              required
              autoFocus
              defaultValue={amount ?? ""}
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
      ) : amount !== null ? (
        <BudgetProgressBar spent={spent} amount={amount} currency={currency} />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No budget set. Spent so far: {formatMoney(spent, currency)}.
          </p>
          <form action={updateAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <div className="min-w-0 flex-1 space-y-1">
              <label
                htmlFor="overall-amount-new"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Set a monthly cap ({currency})
              </label>
              <input
                id="overall-amount-new"
                name="amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="min-h-10 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {updatePending ? "Saving…" : "Set budget"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
