"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createExpenseAction,
  type ExpenseFormState,
} from "@/lib/actions/expenses";

export type CategoryOption = {
  id: string;
  name: string;
};

const initialState: ExpenseFormState = null;

type ExpenseCreateFormProps = {
  categories: CategoryOption[];
  defaultDate: string;
};

export function ExpenseCreateForm({
  categories,
  defaultDate,
}: ExpenseCreateFormProps) {
  const [state, formAction, pending] = useActionState(
    createExpenseAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  if (categories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        Add a category first before recording expenses.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Add expense
      </h2>

      {state?.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="amount"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="spentAt"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Date
          </label>
          <input
            id="spentAt"
            name="spentAt"
            type="date"
            required
            defaultValue={defaultDate}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="categoryId"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={categories[0]?.id}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="note"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Note <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={500}
            placeholder="Lunch, taxi, …"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}
