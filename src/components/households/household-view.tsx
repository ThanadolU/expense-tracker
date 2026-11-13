"use client";

import { useState } from "react";
import type {
  HouseholdWithDetails,
  HouseholdExpenseItem,
  HouseholdSettlementItem,
  HouseholdBalancesSummary,
} from "@/lib/household";
import { formatMoney } from "@/lib/money";
import { HouseholdBalanceSummary } from "@/components/households/household-balance-summary";
import { HouseholdExpensesList } from "@/components/households/household-expenses-list";
import { HouseholdSettlementsList } from "@/components/households/household-settlements-list";
import { HouseholdMembersList } from "@/components/households/household-members-list";
import { HouseholdInvitesList } from "@/components/households/household-invites-list";
import { CreateHouseholdExpenseModal } from "@/components/households/create-household-expense-modal";
import { SettleUpModal } from "@/components/households/settle-up-modal";
import { InviteMemberModal } from "@/components/households/invite-member-modal";
import { EditHouseholdModal } from "@/components/households/edit-household-modal";

type HouseholdViewProps = {
  household: HouseholdWithDetails;
  expenses: HouseholdExpenseItem[];
  settlements: HouseholdSettlementItem[];
  balances: HouseholdBalancesSummary;
  currentUserId: string;
};

type TabType = "expenses" | "balances" | "settlements" | "members";

export function HouseholdView({
  household,
  expenses,
  settlements,
  balances,
  currentUserId,
}: HouseholdViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("expenses");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const isOwed = balances.userNetBalance > 0.01;
  const owes = balances.userNetBalance < -0.01;
  const isSettled = !isOwed && !owes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              {household.name}
            </h1>
            <span
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                household.isOwner
                  ? "border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
              ].join(" ")}
            >
              {household.isOwner ? "Owner" : "Member"}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {household.members.length} member{household.members.length === 1 ? "" : "s"} • Base Currency: {household.currency}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Expense
          </button>

          <button
            type="button"
            onClick={() => setIsSettleModalOpen(true)}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750"
          >
            Settle Up
          </button>

          <InviteMemberModal
            householdId={household.id}
            householdName={household.name}
          />

          {household.isOwner && (
            <EditHouseholdModal
              householdId={household.id}
              currentName={household.name}
            />
          )}
        </div>
      </div>

      {/* Top Balance Indicator Banner */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold",
              isOwed
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : owes
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
            ].join(" ")}
          >
            {isOwed ? "↑" : owes ? "↓" : "✓"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Your Status:
              </span>
              <span
                className={[
                  "text-xs font-bold",
                  isOwed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : owes
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-zinc-600 dark:text-zinc-300",
                ].join(" ")}
              >
                {isSettled
                  ? "All settled up"
                  : isOwed
                  ? `You are owed ${formatMoney(balances.userNetBalance, household.currency)}`
                  : `You owe ${formatMoney(Math.abs(balances.userNetBalance), household.currency)}`}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Total household spend: {formatMoney(balances.totalHouseholdSpend, household.currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {owes && (
            <button
              type="button"
              onClick={() => setIsSettleModalOpen(true)}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-700"
            >
              Pay Balance
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("balances")}
            className="text-xs font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            View debt breakdown →
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("expenses")}
            className={[
              "flex items-center gap-2 border-b-2 py-3 text-xs font-medium transition",
              activeTab === "expenses"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300",
            ].join(" ")}
          >
            <span>Expenses</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] dark:bg-zinc-800">
              {expenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("balances")}
            className={[
              "flex items-center gap-2 border-b-2 py-3 text-xs font-medium transition",
              activeTab === "balances"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300",
            ].join(" ")}
          >
            <span>Balances & Settle</span>
            {balances.suggestedRepayments.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {balances.suggestedRepayments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settlements")}
            className={[
              "flex items-center gap-2 border-b-2 py-3 text-xs font-medium transition",
              activeTab === "settlements"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300",
            ].join(" ")}
          >
            <span>Settlement History</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] dark:bg-zinc-800">
              {settlements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={[
              "flex items-center gap-2 border-b-2 py-3 text-xs font-medium transition",
              activeTab === "members"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300",
            ].join(" ")}
          >
            <span>Members & Invites</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] dark:bg-zinc-800">
              {household.members.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <HouseholdExpensesList
            householdId={household.id}
            expenses={expenses}
            currentUserId={currentUserId}
            isOwner={household.isOwner}
            currency={household.currency}
          />
        </div>
      )}

      {activeTab === "balances" && (
        <HouseholdBalanceSummary
          householdId={household.id}
          balances={balances}
          members={household.members}
          currentUserId={currentUserId}
          currency={household.currency}
        />
      )}

      {activeTab === "settlements" && (
        <HouseholdSettlementsList
          householdId={household.id}
          settlements={settlements}
          currentUserId={currentUserId}
          isOwner={household.isOwner}
          currency={household.currency}
        />
      )}

      {activeTab === "members" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <HouseholdMembersList
              householdId={household.id}
              members={household.members}
              currentUserId={currentUserId}
              isOwner={household.isOwner}
            />

            <HouseholdInvitesList
              householdId={household.id}
              invites={household.invites}
              isOwner={household.isOwner}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Household Overview
              </h3>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-800">
                  <dt className="text-zinc-500 dark:text-zinc-400">Total Members</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {household.members.length}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-800">
                  <dt className="text-zinc-500 dark:text-zinc-400">Your Role</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {household.currentUserRole}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-800">
                  <dt className="text-zinc-500 dark:text-zinc-400">Base Currency</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {household.currency}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-zinc-500 dark:text-zinc-400">Expenses Logged</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {expenses.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateHouseholdExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        householdId={household.id}
        members={household.members}
        currentUserId={currentUserId}
        currency={household.currency}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        householdId={household.id}
        members={household.members}
        currentUserId={currentUserId}
        currency={household.currency}
      />
    </div>
  );
}
