import { formatDateInput } from "@/lib/money";
import { paymentMethodLabel, type PaymentMethodId } from "@/lib/payment-methods";

export type ExpenseCsvRow = {
  spentAt: Date | string;
  amount: { toString(): string } | string | number;
  currency?: string;
  category?: { name: string } | null;
  categoryName?: string | null;
  paymentMethod: PaymentMethodId | string;
  note?: string | null;
};

export const CSV_HEADERS = [
  "Date",
  "Amount",
  "Currency",
  "Category",
  "Payment Method",
  "Note",
] as const;

/**
 * Escapes a single field according to RFC 4180.
 * If the value contains commas, double quotes, or newlines,
 * wrap it in double quotes and escape internal quotes by doubling them.
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) {
    return "";
  }
  const str = String(value);
  if (
    str.includes('"') ||
    str.includes(",") ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format an amount into standard 2-decimal string (e.g. "120.00").
 */
export function formatCsvAmount(
  amount: { toString(): string } | string | number,
): string {
  const n = typeof amount === "number" ? amount : Number(amount.toString());
  if (Number.isFinite(n)) {
    return n.toFixed(2);
  }
  return String(amount);
}

export type FormatExpensesCsvOptions = {
  /**
   * Prepend UTF-8 Byte Order Mark (\uFEFF).
   * Ensures Excel / spreadsheet software open UTF-8 (Thai, accents, etc.) properly.
   * Defaults to true.
   */
  includeBom?: boolean;
};

/**
 * Generates an RFC 4180 compliant CSV string for a list of expenses.
 */
export function formatExpensesAsCsv(
  expenses: ExpenseCsvRow[],
  options: FormatExpensesCsvOptions = {},
): string {
  const { includeBom = true } = options;
  const lines: string[] = [];

  // Header line
  lines.push(CSV_HEADERS.map(escapeCsvField).join(","));

  for (const expense of expenses) {
    const date = formatDateInput(expense.spentAt);
    const amount = formatCsvAmount(expense.amount);
    const currency = expense.currency || "THB";
    const categoryName =
      expense.category?.name ?? expense.categoryName ?? "Uncategorized";
    const paymentMethod = paymentMethodLabel(expense.paymentMethod);
    const note = expense.note ?? "";

    const row = [
      escapeCsvField(date),
      escapeCsvField(amount),
      escapeCsvField(currency),
      escapeCsvField(categoryName),
      escapeCsvField(paymentMethod),
      escapeCsvField(note),
    ];

    lines.push(row.join(","));
  }

  const csvContent = lines.join("\r\n");
  return (includeBom ? "\uFEFF" : "") + csvContent;
}
