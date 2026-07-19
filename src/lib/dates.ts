/**
 * Month / date helpers for dashboard and expense filters.
 *
 * Expense `spentAt` is stored as Postgres DATE (`@db.Date`), represented in
 * Prisma as a Date at UTC midnight. Month ranges use the same convention:
 *
 *   spentAt >= start  AND  spentAt < endExclusive
 *
 * where `start` is the first day of the month (UTC) and `endExclusive` is
 * the first day of the next month (UTC). Inclusive on both calendar ends
 * of the month without depending on "last day" length.
 */

export type YearMonth = {
  /** Full year, e.g. 2026 */
  year: number;
  /** Calendar month 1–12 */
  month: number;
};

export type MonthRange = {
  /** Inclusive: first moment of the first day (UTC midnight). */
  start: Date;
  /** Exclusive: first day of the next month (UTC midnight). */
  endExclusive: Date;
};

const MONTH_PARAM_RE = /^(\d{4})-(\d{2})$/;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function isValidYearMonth(year: number, month: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    year >= 1970 &&
    year <= 2100 &&
    month >= 1 &&
    month <= 12
  );
}

/** Current calendar month in the server's local timezone. */
export function currentYearMonth(now: Date = new Date()): YearMonth {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

/**
 * Parse a `YYYY-MM` query param (e.g. from `<input type="month">`).
 * Returns `null` for empty / invalid values (caller may fall back to current month).
 */
export function parseMonthParam(value: string | null | undefined): YearMonth | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") {
    return null;
  }

  const match = MONTH_PARAM_RE.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!isValidYearMonth(year, month)) {
    return null;
  }

  return { year, month };
}

/**
 * Resolve month from a query param, defaulting to the current month.
 * Use when a month is always required (e.g. dashboard).
 */
export function resolveYearMonth(
  value: string | null | undefined,
  now: Date = new Date(),
): YearMonth {
  return parseMonthParam(value) ?? currentYearMonth(now);
}

/**
 * UTC date range for a calendar month, matching `@db.Date` storage.
 *
 * Prisma filter:
 *   { spentAt: { gte: range.start, lt: range.endExclusive } }
 */
export function monthRange(year: number, month: number): MonthRange {
  if (!isValidYearMonth(year, month)) {
    throw new Error(`Invalid year/month: ${year}-${month}`);
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const endExclusive = new Date(Date.UTC(year, month, 1));

  return { start, endExclusive };
}

export function monthRangeFrom(ym: YearMonth): MonthRange {
  return monthRange(ym.year, ym.month);
}

/** Prisma-friendly spentAt filter for a month (gte + lt). */
export function spentAtMonthFilter(year: number, month: number) {
  const { start, endExclusive } = monthRange(year, month);
  return {
    gte: start,
    lt: endExclusive,
  } as const;
}

/** Human label, e.g. "July 2026". */
export function formatMonthLabel(year: number, month: number): string {
  if (!isValidYearMonth(year, month)) {
    return `${year}-${String(month).padStart(2, "0")}`;
  }
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatMonthLabelFrom(ym: YearMonth): string {
  return formatMonthLabel(ym.year, ym.month);
}

/** Value for `<input type="month">`, e.g. "2026-07". */
export function toMonthInputValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function toMonthInputValueFrom(ym: YearMonth): string {
  return toMonthInputValue(ym.year, ym.month);
}

/**
 * Recent months newest-first (for filter dropdowns).
 * @param count how many months to include (default 24)
 */
export function recentYearMonths(
  count = 24,
  now: Date = new Date(),
): YearMonth[] {
  const result: YearMonth[] = [];
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  for (let i = 0; i < count; i++) {
    result.push({ year, month });
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return result;
}

/**
 * Resolve month filter for the expenses list.
 * - missing param → current month (default)
 * - `all` / empty → all months (no date filter)
 * - valid `YYYY-MM` → that month
 * - invalid → current month
 */
export function resolveExpenseMonthParam(
  value: string | null | undefined,
  now: Date = new Date(),
): YearMonth | null {
  if (value == null) {
    return currentYearMonth(now);
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "" || trimmed === "all") {
    return null;
  }
  return parseMonthParam(value) ?? currentYearMonth(now);
}
