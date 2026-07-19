import { DEFAULT_CURRENCY } from "@/lib/constants";

/** Format amount for display, e.g. "12.50 THB". */
export function formatMoney(
  amount: { toString(): string } | string | number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const n = typeof amount === "number" ? amount : Number(amount.toString());
  if (Number.isNaN(n)) {
    return `${amount} ${currency}`;
  }
  return `${n.toFixed(2)} ${currency}`;
}

/** Format a Date or ISO date string as YYYY-MM-DD for display/inputs. */
export function formatDateInput(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateDisplay(value: Date | string): string {
  return formatDateInput(value);
}

/** Today's date in local timezone as YYYY-MM-DD (for date inputs). */
export function todayDateInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
