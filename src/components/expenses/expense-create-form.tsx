"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createExpenseAction,
  type ExpenseFormState,
} from "@/lib/actions/expenses";
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
} from "@/lib/payment-methods";
import { ReceiptUploadInput } from "@/components/expenses/receipt-upload-input";

export type CategoryOption = {
  id: string;
  name: string;
};

const initialState: ExpenseFormState = null;

type ExpenseCreateFormProps = {
  categories: CategoryOption[];
  defaultDate: string;
  isOpen?: boolean;
  onClose?: () => void;
};

export function ExpenseCreateForm({
  categories,
  defaultDate,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: ExpenseCreateFormProps) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const [formKey, setFormKey] = useState(0);

  const handleOpen = () => {
    setFormKey((prev) => prev + 1);
    if (!isControlled) {
      setUncontrolledIsOpen(true);
    }
  };

  const handleClose = useCallback(() => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setUncontrolledIsOpen(false);
    }
  }, [isControlled, controlledOnClose]);

  const handleSuccess = () => {
    handleClose();
    setFormKey((prev) => prev + 1);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add expense
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-dialog-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
                <h2
                  id="expense-dialog-title"
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  Add expense
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
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

            {categories.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Add a category first before recording expenses.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Link
                    href="/categories"
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    Go to Categories
                  </Link>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="min-h-10 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <ExpenseModalForm
                key={formKey}
                categories={categories}
                defaultDate={defaultDate}
                onSuccess={handleSuccess}
                onCancel={handleClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ExpenseModalForm({
  categories,
  defaultDate,
  onSuccess,
  onCancel,
}: {
  categories: CategoryOption[];
  defaultDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createExpenseAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 space-y-4"
    >
      {state?.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
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
            autoFocus
            placeholder="0.00"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
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
            className="date-input block w-full max-w-full min-h-10 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
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
            className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 space-y-1.5">
          <label
            htmlFor="paymentMethod"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Payment method
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            required
            defaultValue={DEFAULT_PAYMENT_METHOD}
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

        <div className="min-w-0 space-y-1.5 sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Receipt <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <ReceiptUploadInput disabled={pending} />
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="min-h-10 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-white dark:text-zinc-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Saving…</span>
            </>
          ) : (
            "Add expense"
          )}
        </button>
      </div>
    </form>
  );
}
