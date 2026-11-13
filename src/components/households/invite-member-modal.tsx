"use client";

import { useState, useActionState } from "react";
import {
  inviteMemberAction,
  type HouseholdFormState,
} from "@/lib/actions/household";

const initialState: HouseholdFormState = null;

type InviteMemberModalProps = {
  householdId: string;
  householdName: string;
};

export function InviteMemberModal({
  householdId,
  householdName,
}: InviteMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(
    inviteMemberAction,
    initialState,
  );

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!pending) {
      setIsOpen(false);
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
        Invite Member
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
            onClick={handleClose}
          />

          {/* Modal box */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Invite to {householdName}
              </h2>
              <button
                type="button"
                disabled={pending}
                onClick={handleClose}
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

            {state?.ok && state.inviteUrl ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <div className="flex items-center gap-2 font-medium">
                    <svg
                      className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Invitation Created!</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                    An email invitation has been dispatched. You can also copy the direct invitation link below:
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Direct Invite Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={state.inviteUrl}
                      className="min-h-9 flex-1 truncate rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 select-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(state.inviteUrl!)}
                      className="inline-flex min-h-9 items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="min-h-9 rounded-md border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
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

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Member Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="role"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Role in Household
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="MEMBER"
                    className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  >
                    <option value="MEMBER">Member (Can view and log shared expenses)</option>
                    <option value="OWNER">Owner (Can manage members and settings)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleClose}
                    className="min-h-10 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="min-h-10 rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    {pending ? "Sending…" : "Send Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
