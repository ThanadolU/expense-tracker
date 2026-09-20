"use client";

import { useActionState, useRef, useState } from "react";
import {
  createRecurringExpenseAction,
  updateRecurringExpenseAction,
  type RecurringFormState,
} from "@/lib/actions/recurring";
import type { CategoryOption } from "@/components/expenses/expense-create-form";
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/lib/payment-methods";
import { CADENCE_LABELS, type RecurringCadence } from "@/lib/recurring-utils";

export type RecurringItem = {
  id: string;
  title: string;
  amount: string;
  currency: string;
  categoryId: string;
  categoryName: string;
  paymentMethod: PaymentMethodId | string;
  cadence: RecurringCadence;
  nextDueDate: string;
  isActive: boolean;
  note: string | null;
};

type RecurringFormDialogProps = {
  categories: CategoryOption[];
  defaultDate: string;
  initialData?: RecurringItem | null;
  isOpen: boolean;
  onClose: () => void;
};

const initialState: RecurringFormState = null;

export function RecurringFormDialog({
  categories,
  defaultDate,
  initialData,
  isOpen,
  onClose,
}: RecurringFormDialogProps) {
  const isEditing = Boolean(initialData);

  const [createState, createAction, createPending] = useActionState(
    createRecurringExpenseAction,
    initialState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateRecurringExpenseAction,
    initialState,
  );

  const state = isEditing ? updateState : createState;
  const pending = isEditing ? updatePending : createPending;
  const formRef = useRef<HTMLFormElement>(null);

  const [prevSuccessState, setPrevSuccessState] = useState(state?.success);
  if (state?.success !== prevSuccessState) {
    setPrevSuccessState(state?.success);
    if (state?.success) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-dialog-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2
            id="recurring-dialog-title"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {isEditing ? "Edit recurring expense" : "Add recurring expense"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close dialog"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          ref={formRef}
          action={isEditing ? updateAction : createAction}
          className="mt-4 space-y-4"
        >
          {isEditing && <input type="hidden" name="id" value={initialData!.id} />}

          {state?.error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="rec-title"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Title / Description
            </label>
            <input
              id="rec-title"
              name="title"
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Netflix, Apartment Rent, Gym membership"
              defaultValue={initialData?.title ?? ""}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="rec-amount"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Amount (THB)
              </label>
              <input
                id="rec-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                defaultValue={initialData?.amount ?? ""}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rec-cadence"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Frequency
              </label>
              <select
                id="rec-cadence"
                name="cadence"
                required
                defaultValue={initialData?.cadence ?? "MONTHLY"}
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {(Object.keys(CADENCE_LABELS) as RecurringCadence[]).map((cadence) => (
                  <option key={cadence} value={cadence}>
                    {CADENCE_LABELS[cadence]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rec-categoryId"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Category
              </label>
              <select
                id="rec-categoryId"
                name="categoryId"
                required
                defaultValue={initialData?.categoryId ?? categories[0]?.id}
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
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
                htmlFor="rec-paymentMethod"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Payment Method
              </label>
              <select
                id="rec-paymentMethod"
                name="paymentMethod"
                required
                defaultValue={initialData?.paymentMethod ?? DEFAULT_PAYMENT_METHOD}
                className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <label
                htmlFor="rec-nextDueDate"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Next Due Date
              </label>
              <input
                id="rec-nextDueDate"
                name="nextDueDate"
                type="date"
                required
                defaultValue={initialData?.nextDueDate ?? defaultDate}
                className="date-input block w-full max-w-full min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                An expense entry will be automatically generated whenever this date is reached or passed.
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="rec-note"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Note <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="rec-note"
                name="note"
                type="text"
                maxLength={500}
                placeholder="Account number, memo, or extra details"
                defaultValue={initialData?.note ?? ""}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {pending ? "Saving…" : isEditing ? "Save changes" : "Create template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
