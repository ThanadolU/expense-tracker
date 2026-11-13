"use client";

import { useState, useActionState, useEffect } from "react";
import {
  createHouseholdExpenseAction,
  type HouseholdFormState,
} from "@/lib/actions/household";
import { HOUSEHOLD_CATEGORIES } from "@/lib/constants";
import type { HouseholdMemberItem } from "@/lib/household";
import { todayDateInput, formatMoney } from "@/lib/money";

type CreateHouseholdExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  members: HouseholdMemberItem[];
  currentUserId: string;
  currency?: string;
};

const initialState: HouseholdFormState = null;

export function CreateHouseholdExpenseModal({
  isOpen,
  onClose,
  householdId,
  members,
  currentUserId,
  currency = "THB",
}: CreateHouseholdExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(todayDateInput());
  const [category, setCategory] = useState<string>(HOUSEHOLD_CATEGORIES[0]);
  const [paidById, setPaidById] = useState(currentUserId);
  const [splitType, setSplitType] = useState<"EQUAL" | "FULL">("EQUAL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    members.map((m) => m.userId),
  );

  const [state, formAction, pending] = useActionState(
    createHouseholdExpenseAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      onClose();
    }
  }, [state, onClose]);

  const toggleMemberSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const parsedAmount = parseFloat(amount);
  const splitShare =
    !isNaN(parsedAmount) && parsedAmount > 0 && selectedUserIds.length > 0
      ? parsedAmount / selectedUserIds.length
      : 0;

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
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Add Shared Expense
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
          <input type="hidden" name="splitType" value={splitType} />

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Description / Title
            </label>
            <input
              type="text"
              required
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              placeholder="e.g. Weekly grocery run, Electricity bill, Dinner"
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
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
                name="spentAt"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
                disabled={pending}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={pending}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {HOUSEHOLD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Paid By
              </label>
              <select
                name="paidById"
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
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

          {/* Split Mode Selector */}
          <div className="rounded-lg border border-zinc-200 p-3.5 dark:border-zinc-800">
            <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Split Options
            </span>

            <div className="mt-2.5 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="splitModeRadio"
                  checked={splitType === "EQUAL"}
                  onChange={() => setSplitType("EQUAL")}
                  className="h-3.5 w-3.5 text-zinc-900 focus:ring-zinc-900"
                />
                Split between members
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="splitModeRadio"
                  checked={splitType === "FULL"}
                  onChange={() => setSplitType("FULL")}
                  className="h-3.5 w-3.5 text-zinc-900 focus:ring-zinc-900"
                />
                No split (Payer covers 100%)
              </label>
            </div>

            {splitType === "EQUAL" && (
              <div className="mt-3.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Split with ({selectedUserIds.length} members):
                  </span>
                  {splitShare > 0 && (
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      ~{formatMoney(splitShare, currency)} / person
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {members.map((m) => {
                    const isSelected = selectedUserIds.includes(m.userId);
                    return (
                      <label
                        key={m.userId}
                        className={[
                          "flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition",
                          isSelected
                            ? "border-zinc-900 bg-zinc-50/70 font-medium text-zinc-900 dark:border-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-100"
                            : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          name="splitUserIds"
                          value={m.userId}
                          checked={isSelected}
                          onChange={() => toggleMemberSelection(m.userId)}
                          className="h-3.5 w-3.5 rounded text-zinc-900 focus:ring-zinc-900"
                        />
                        <span>
                          {m.name || m.email.split("@")[0]}
                          {m.userId === currentUserId ? " (You)" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
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
              {pending ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
