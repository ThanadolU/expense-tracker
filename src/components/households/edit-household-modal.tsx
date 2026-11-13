"use client";

import { useState, useActionState, useTransition } from "react";
import {
  updateHouseholdAction,
  deleteHouseholdAction,
  type HouseholdFormState,
} from "@/lib/actions/household";

const initialState: HouseholdFormState = null;

type EditHouseholdModalProps = {
  householdId: string;
  currentName: string;
};

export function EditHouseholdModal({
  householdId,
  currentName,
}: EditHouseholdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [state, formAction, pending] = useActionState(
    updateHouseholdAction,
    initialState,
  );

  const handleDelete = () => {
    if (
      !confirm(
        `Are you sure you want to delete "${currentName}"? This action is permanent and will remove all members and invites.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("householdId", householdId);

    startDeleteTransition(async () => {
      try {
        await deleteHouseholdAction(formData);
      } catch (err: unknown) {
        alert(
          err instanceof Error ? err.message : "Failed to delete household.",
        );
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Settings
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
            onClick={() => !pending && !isDeleting && setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Household Settings
              </h2>
              <button
                type="button"
                disabled={pending || isDeleting}
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

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="householdId" value={householdId} />

              {state?.error && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                  role="alert"
                >
                  {state.error}
                </div>
              )}

              {state?.ok && (
                <div
                  className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                  role="status"
                >
                  Settings updated successfully.
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
                  defaultValue={currentName}
                  className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={pending || isDeleting}
                  onClick={() => setIsOpen(false)}
                  className="min-h-9 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || isDeleting}
                  className="min-h-9 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {pending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>

            <hr className="my-5 border-zinc-200 dark:border-zinc-800" />

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Danger Zone
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Delete this household
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Permanently delete this space and all member associations.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isDeleting || pending}
                  onClick={handleDelete}
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
