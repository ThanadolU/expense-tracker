"use client";

import { useState, useActionState, useEffect } from "react";
import {
  createSettlementAction,
  type HouseholdFormState,
} from "@/lib/actions/household";
import type { HouseholdMemberItem } from "@/lib/household";
import { todayDateInput } from "@/lib/money";

type SettleUpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  members: HouseholdMemberItem[];
  currentUserId: string;
  initialDebtorId?: string;
  initialCreditorId?: string;
  initialAmount?: number;
  currency?: string;
};

const initialState: HouseholdFormState = null;

export function SettleUpModal({
  isOpen,
  onClose,
  householdId,
  members,
  currentUserId,
  initialDebtorId,
  initialCreditorId,
  initialAmount,
  currency = "THB",
}: SettleUpModalProps) {
  const [fromUserId, setFromUserId] = useState(
    initialDebtorId || currentUserId,
  );
  const [toUserId, setToUserId] = useState(
    initialCreditorId ||
      members.find((m) => m.userId !== (initialDebtorId || currentUserId))
        ?.userId ||
      "",
  );
  const [amount, setAmount] = useState(
    initialAmount ? initialAmount.toFixed(2) : "",
  );
  const [settledAt, setSettledAt] = useState(todayDateInput());
  const [note, setNote] = useState("");

  const [state, formAction, pending] = useActionState(
    createSettlementAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      onClose();
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => !pending && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Record Settlement Payment
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
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

        {state?.error && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="householdId" value={householdId} />

          <div className="grid grid-cols-2 gap-3">
            {/* Payer (From) */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Payer (Who paid)
              </label>
              <select
                name="fromUserId"
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
                disabled={pending}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name || m.email.split("@")[0]}
                    {m.userId === currentUserId ? " (You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient (To) */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Recipient (Paid to)
              </label>
              <select
                name="toUserId"
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                disabled={pending}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name || m.email.split("@")[0]}
                    {m.userId === currentUserId ? " (You)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={pending}
                placeholder="0.00"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Date
              </label>
              <input
                type="date"
                required
                name="settledAt"
                value={settledAt}
                onChange={(e) => setSettledAt(e.target.value)}
                disabled={pending}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Note / Payment memo */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Note (optional)
            </label>
            <input
              type="text"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={pending}
              placeholder="e.g. PromptPay, Bank transfer, Cash"
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {pending ? "Saving..." : "Record Settlement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
