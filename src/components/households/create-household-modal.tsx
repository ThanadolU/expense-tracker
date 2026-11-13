"use client";

import { useState, useActionState } from "react";
import {
  createHouseholdAction,
  type HouseholdFormState,
} from "@/lib/actions/household";

const initialState: HouseholdFormState = null;

export function CreateHouseholdModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createHouseholdAction,
    initialState,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        New Household
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => !pending && setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Create a Household
              </h2>
              <button
                type="button"
                disabled={pending}
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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

            <p className="mb-5 text-xs text-zinc-600 dark:text-zinc-400">
              Create a shared space to manage shared expenses, divide bills, and track balances with roommates or family members.
            </p>

            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                  role="alert"
                >
                  {state.error}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Household Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. Our Apartment, Family Home"
                  className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setIsOpen(false)}
                  className="min-h-10 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="min-h-10 rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {pending ? "Creating…" : "Create Household"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
