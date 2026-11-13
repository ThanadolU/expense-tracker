"use client";

import { useTransition, useState } from "react";
import { deleteHouseholdExpenseAction } from "@/lib/actions/household";
import type { HouseholdExpenseItem } from "@/lib/household";
import { formatMoney, formatDateDisplay } from "@/lib/money";

type HouseholdExpensesListProps = {
  householdId: string;
  expenses: HouseholdExpenseItem[];
  currentUserId: string;
  isOwner: boolean;
  currency?: string;
};

export function HouseholdExpensesList({
  householdId,
  expenses,
  currentUserId,
  isOwner,
  currency = "THB",
}: HouseholdExpensesListProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = (expenseId: string, description: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${description}"? This will remove all associated split balances.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("householdId", householdId);
    formData.set("expenseId", expenseId);

    startTransition(async () => {
      try {
        await deleteHouseholdExpenseAction(formData);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete expense.");
      }
    });
  };

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          No shared expenses yet
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Log grocery runs, bills, or outings to track who paid and split the costs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Shared Expenses ({expenses.length})
        </h3>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {expenses.map((exp) => {
          const payerName =
            exp.paidById === currentUserId
              ? "You"
              : exp.paidByName || exp.paidByEmail.split("@")[0];

          const canDelete = exp.paidById === currentUserId || isOwner;
          const isExpanded = expandedId === exp.id;

          return (
            <div
              key={exp.id}
              className="p-4 transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {exp.description}
                    </span>
                    {exp.category && (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {exp.category}
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      • {formatDateDisplay(exp.spentAt)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Paid by <strong className="text-zinc-700 dark:text-zinc-200">{payerName}</strong>
                    {" • "}
                    {exp.splitType === "FULL" ? (
                      <span className="italic">100% paid by payer</span>
                    ) : (
                      <span>
                        Split {exp.splits.length} ways (
                        {formatMoney(exp.splits[0]?.amount || 0, currency)}/ea)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatMoney(exp.amount, currency)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                    className="rounded p-1 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
                    title={isExpanded ? "Collapse splits" : "Expand splits"}
                  >
                    <svg
                      className={`h-4 w-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(exp.id, exp.description)}
                      disabled={isPending}
                      className="rounded p-1 text-zinc-400 transition hover:text-rose-600 dark:hover:text-rose-400"
                      title="Delete expense"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Split Breakdown */}
              {isExpanded && (
                <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-800/40">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Split Details:
                  </span>
                  <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
                    {exp.splits.map((s) => {
                      const splitMemberName =
                        s.userId === currentUserId
                          ? "You"
                          : s.userName || s.userEmail.split("@")[0];

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between text-zinc-600 dark:text-zinc-400"
                        >
                          <span>{splitMemberName}:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200">
                            {formatMoney(s.amount, currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
