import type { RecurringCadence } from "@/generated/prisma/client";

export type { RecurringCadence };

/**
 * Cadence display labels.
 */
export const CADENCE_LABELS: Record<RecurringCadence, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

/**
 * Get days in a specific year and month (month is 1-indexed: 1..12).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Advance a date by a given cadence using UTC calendar arithmetic.
 * Handles month-end clamping (e.g. Jan 31 -> Feb 28/29).
 */
export function advanceDate(date: Date, cadence: RecurringCadence): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0..11
  const day = date.getUTCDate();

  switch (cadence) {
    case "DAILY": {
      const next = new Date(date.getTime());
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }
    case "WEEKLY": {
      const next = new Date(date.getTime());
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }
    case "MONTHLY": {
      let targetYear = year;
      let targetMonth = month + 1;
      if (targetMonth > 11) {
        targetYear += Math.floor(targetMonth / 12);
        targetMonth = targetMonth % 12;
      }
      const daysInTarget = getDaysInMonth(targetYear, targetMonth + 1);
      const targetDay = Math.min(day, daysInTarget);
      return new Date(Date.UTC(targetYear, targetMonth, targetDay));
    }
    case "YEARLY": {
      const targetYear = year + 1;
      const daysInTarget = getDaysInMonth(targetYear, month + 1);
      const targetDay = Math.min(day, daysInTarget);
      return new Date(Date.UTC(targetYear, month, targetDay));
    }
  }
}

/**
 * Normalize an amount to estimated monthly equivalent for dashboard/summary projection.
 */
export function estimateMonthlyAmount(amount: number, cadence: RecurringCadence): number {
  switch (cadence) {
    case "DAILY":
      return amount * 30;
    case "WEEKLY":
      return (amount * 52) / 12;
    case "MONTHLY":
      return amount;
    case "YEARLY":
      return amount / 12;
  }
}

/**
 * Returns UTC midnight for today's local date.
 */
export function getUtcToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
