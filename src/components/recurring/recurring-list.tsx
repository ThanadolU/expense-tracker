"use client";

import { useState, useTransition } from "react";
import {
  deleteRecurringExpenseAction,
  toggleRecurringExpenseActiveAction,
  triggerRecurringProcessAction,
} from "@/lib/actions/recurring";
import type { CategoryOption } from "@/components/expenses/expense-create-form";
import { PaymentMethodIcon } from "@/components/expenses/payment-method-icon";
import {
  RecurringFormDialog,
  type RecurringItem,
} from "@/components/recurring/recurring-form-dialog";
import { formatDateInput, formatMoney } from "@/lib/money";
import { paymentMethodShortLabel } from "@/lib/payment-methods";
import {
  CADENCE_LABELS,
  estimateMonthlyAmount,
} from "@/lib/recurring-utils";

type RecurringListProps = {
  items: RecurringItem[];
  categories: CategoryOption[];
  defaultDate: string;
};

export function RecurringList({
  items,
  categories,
  defaultDate,
}: RecurringListProps) {
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeCount = items.filter((i) => i.isActive).length;
  const totalMonthlyProjection = items
    .filter((i) => i.isActive)
    .reduce(
      (sum, item) => sum + estimateMonthlyAmount(Number(item.amount), item.cadence),
      0,
    );

  const handleToggleActive = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleRecurringExpenseActiveAction(id, !currentActive);
      if (!res.success && res.error) {
        setStatusMessage(res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring expense template? Past generated expenses will not be deleted.")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteRecurringExpenseAction(id);
      if (!res.success && res.error) {
        setStatusMessage(res.error);
      }
    });
  };

  const handleProcessNow = () => {
    startTransition(async () => {
      const res = await triggerRecurringProcessAction();
      if (res.success) {
        if (res.generatedCount > 0) {
          setStatusMessage(
            `Generated ${res.generatedCount} due expense${res.generatedCount > 1 ? "s" : ""}.`,
          );
        } else {
          setStatusMessage("All recurring expenses are up to date. No new expenses generated.");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Active Templates
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {activeCount}{" "}
            <span className="text-sm font-normal text-zinc-400">
              / {items.length} total
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Est. Monthly Commitment
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatMoney(totalMonthlyProjection.toFixed(2), "THB")}
          </p>
          <p className="text-[11px] text-zinc-400">
            Normalized across all cadences
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Auto-Generation
            </p>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              Runs automatically on app visit
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleProcessNow}
            className="mt-2 inline-flex min-h-9 items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {isPending ? "Checking…" : "Run check now"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recurring Templates
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Define recurring subscriptions or bills. Adjust template amount at any time or edit individual generated expenses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          + Add recurring expense
        </button>
      </div>

      {/* Templates List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              className="h-6 w-6 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No recurring expenses yet
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Create recurring templates for monthly rent, streaming subscriptions, gym memberships, or bills.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 inline-flex min-h-9 items-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Create first template
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => (
              <li
                key={item.id}
                className={`p-4 transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 ${
                  !item.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {item.title}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {item.categoryName}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {CADENCE_LABELS[item.cadence]}
                      </span>
                      {!item.isActive && (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          Paused
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <PaymentMethodIcon method={item.paymentMethod} />
                        <span>{paymentMethodShortLabel(item.paymentMethod)}</span>
                      </span>
                      <span>Next: {formatDateInput(item.nextDueDate)}</span>
                      {item.note && (
                        <span className="truncate max-w-xs text-zinc-400 dark:text-zinc-500">
                          • {item.note}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                        {formatMoney(item.amount, item.currency)}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        per {item.cadence.toLowerCase().replace("ly", "")}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        title={item.isActive ? "Pause recurring expense" : "Resume recurring expense"}
                        className={`min-h-9 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                          item.isActive
                            ? "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }`}
                      >
                        {item.isActive ? "Pause" : "Resume"}
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setEditingItem(item)}
                        className="min-h-9 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(item.id)}
                        className="min-h-9 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create Dialog */}
      <RecurringFormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        categories={categories}
        defaultDate={defaultDate}
      />

      {/* Edit Dialog */}
      {editingItem && (
        <RecurringFormDialog
          isOpen={true}
          onClose={() => setEditingItem(null)}
          categories={categories}
          defaultDate={defaultDate}
          initialData={editingItem}
        />
      )}
    </div>
  );
}
