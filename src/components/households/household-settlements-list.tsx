"use client";

import { useTransition } from "react";
import { deleteSettlementAction } from "@/lib/actions/household";
import type { HouseholdSettlementItem } from "@/lib/household";
import { formatMoney, formatDateDisplay } from "@/lib/money";

type HouseholdSettlementsListProps = {
  householdId: string;
  settlements: HouseholdSettlementItem[];
  currentUserId: string;
  isOwner: boolean;
  currency?: string;
};

export function HouseholdSettlementsList({
  householdId,
  settlements,
  currentUserId,
  isOwner,
  currency = "THB",
}: HouseholdSettlementsListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (settlementId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this settlement record? Balances will be recalculated.",
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("householdId", householdId);
    formData.set("settlementId", settlementId);

    startTransition(async () => {
      try {
        await deleteSettlementAction(formData);
      } catch (err: unknown) {
        alert(
          err instanceof Error ? err.message : "Failed to delete settlement.",
        );
      }
    });
  };

  if (settlements.length === 0) {
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          No settlements recorded yet
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          When members settle their debts (via PromptPay, bank transfer, or cash), record it to balance the books.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Settlement History ({settlements.length})
        </h3>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {settlements.map((s) => {
          const fromName =
            s.fromUserId === currentUserId
              ? "You"
              : s.fromUserName || s.fromUserEmail.split("@")[0];

          const toName =
            s.toUserId === currentUserId
              ? "You"
              : s.toUserName || s.toUserEmail.split("@")[0];

          const canDelete =
            s.fromUserId === currentUserId ||
            s.toUserId === currentUserId ||
            isOwner;

          return (
            <div
              key={s.id}
              className="flex items-center justify-between p-4 transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {fromName}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500">paid</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {toName}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(s.amount, currency)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <span>{formatDateDisplay(s.settledAt)}</span>
                  {s.note && <span>• {s.note}</span>}
                </div>
              </div>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={isPending}
                  className="rounded p-1 text-zinc-400 transition hover:text-rose-600 dark:hover:text-rose-400"
                  title="Delete settlement"
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
          );
        })}
      </div>
    </div>
  );
}
