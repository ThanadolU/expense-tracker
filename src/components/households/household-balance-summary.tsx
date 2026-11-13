"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import type {
  HouseholdBalancesSummary,
  HouseholdMemberItem,
  SuggestedRepayment,
} from "@/lib/household";
import { SettleUpModal } from "@/components/households/settle-up-modal";

type HouseholdBalanceSummaryProps = {
  householdId: string;
  balances: HouseholdBalancesSummary;
  members: HouseholdMemberItem[];
  currentUserId: string;
  currency?: string;
};

export function HouseholdBalanceSummary({
  householdId,
  balances,
  members,
  currentUserId,
  currency = "THB",
}: HouseholdBalanceSummaryProps) {
  const [selectedRepayment, setSelectedRepayment] = useState<SuggestedRepayment | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const handleOpenSettle = (repayment?: SuggestedRepayment) => {
    setSelectedRepayment(repayment || null);
    setIsSettleModalOpen(true);
  };

  const isOwed = balances.userNetBalance > 0.01;
  const owes = balances.userNetBalance < -0.01;
  const isSettled = !isOwed && !owes;

  return (
    <div className="space-y-4">
      {/* Top Banner Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* User Balance Card */}
        <div
          className={[
            "rounded-xl border p-5 shadow-sm transition",
            isOwed
              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
              : owes
              ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Your Balance
            </span>
            {owes && (
              <button
                type="button"
                onClick={() => handleOpenSettle(balances.userOwes[0])}
                className="inline-flex items-center rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-rose-700"
              >
                Settle Up
              </button>
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={[
                "text-2xl font-bold tracking-tight",
                isOwed
                  ? "text-emerald-700 dark:text-emerald-400"
                  : owes
                  ? "text-rose-700 dark:text-rose-400"
                  : "text-zinc-900 dark:text-zinc-100",
              ].join(" ")}
            >
              {isSettled
                ? "All settled up"
                : `${isOwed ? "+" : ""}${formatMoney(balances.userNetBalance, currency)}`}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {isOwed
              ? "Other household members owe you this amount."
              : owes
              ? "You owe other household members."
              : "You do not owe or have pending claims."}
          </p>
        </div>

        {/* Total Household Spend */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Shared Spend
          </span>
          <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatMoney(balances.totalHouseholdSpend, currency)}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Total of all shared expenses logged in this household.
          </p>
        </div>

        {/* Quick Settle Up Action Card */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Settlements
            </span>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Transfer funds to settle shared debts or record external payments.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenSettle()}
              className="inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750"
            >
              Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Repayments / Debts Section */}
      {balances.suggestedRepayments.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Suggested Debts & Repayments
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Simplified debt resolution to settle all balances with the fewest payments.
          </p>

          <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {balances.suggestedRepayments.map((rep, idx) => {
              const isCurrentUserDebtor = rep.fromUserId === currentUserId;
              const isCurrentUserCreditor = rep.toUserId === currentUserId;

              return (
                <div
                  key={`${rep.fromUserId}-${rep.toUserId}-${idx}`}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={[
                        "font-medium",
                        isCurrentUserDebtor
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-zinc-900 dark:text-zinc-100",
                      ].join(" ")}
                    >
                      {isCurrentUserDebtor ? "You" : rep.fromName}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">owes</span>
                    <span
                      className={[
                        "font-medium",
                        isCurrentUserCreditor
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-900 dark:text-zinc-100",
                      ].join(" ")}
                    >
                      {isCurrentUserCreditor ? "You" : rep.toName}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatMoney(rep.amount, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrentUserDebtor ? (
                      <button
                        type="button"
                        onClick={() => handleOpenSettle(rep)}
                        className="inline-flex items-center rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                      >
                        Settle Up
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenSettle(rep)}
                        className="inline-flex items-center rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Record as Settled
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members Balance Breakdown */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Member Balances Breakdown
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">Member</th>
                <th className="pb-2 font-medium">Paid for House</th>
                <th className="pb-2 font-medium">Their Share</th>
                <th className="pb-2 font-medium">Settled</th>
                <th className="pb-2 text-right font-medium">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {balances.members.map((m) => {
                const displayName = m.name || m.email.split("@")[0];
                const isCurrentUser = m.userId === currentUserId;
                const netSettlements = m.settlementsSent - m.settlementsReceived;

                return (
                  <tr key={m.userId} className={isCurrentUser ? "bg-zinc-50/50 dark:bg-zinc-800/20" : ""}>
                    <td className="py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {isCurrentUser && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-300">
                      {formatMoney(m.totalPaid, currency)}
                    </td>
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-300">
                      {formatMoney(m.totalShare, currency)}
                    </td>
                    <td className="py-2.5 text-zinc-500 dark:text-zinc-400">
                      {netSettlements !== 0
                        ? `${netSettlements > 0 ? "+" : ""}${formatMoney(netSettlements, currency)}`
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      <span
                        className={
                          m.netBalance > 0.01
                            ? "text-emerald-600 dark:text-emerald-400"
                            : m.netBalance < -0.01
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-zinc-500 dark:text-zinc-400"
                        }
                      >
                        {m.netBalance > 0.01 ? "+" : ""}
                        {formatMoney(m.netBalance, currency)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Up Dialog */}
      {isSettleModalOpen && (
        <SettleUpModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          householdId={householdId}
          members={members}
          currentUserId={currentUserId}
          initialDebtorId={selectedRepayment?.fromUserId}
          initialCreditorId={selectedRepayment?.toUserId}
          initialAmount={selectedRepayment?.amount}
          currency={currency}
        />
      )}
    </div>
  );
}
