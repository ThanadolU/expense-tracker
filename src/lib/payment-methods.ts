/**
 * Payment methods for expenses (Phase 5B).
 * Keep in sync with Prisma `enum PaymentMethod`.
 */

export const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "KTB", label: "KTB" },
  { id: "SCB", label: "SCB" },
  { id: "BBL", label: "BBL" },
  { id: "KBANK", label: "KBank" },
  { id: "PROMPTPAY", label: "PromptPay" },
  { id: "OTHER", label: "Other" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "CASH";

const PAYMENT_METHOD_IDS = new Set<string>(
  PAYMENT_METHODS.map((m) => m.id),
);

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return PAYMENT_METHOD_IDS.has(value);
}

export function parsePaymentMethod(
  value: string | null | undefined,
): PaymentMethodId | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  const id = value.trim().toUpperCase();
  return isPaymentMethodId(id) ? id : null;
}

export function paymentMethodLabel(id: PaymentMethodId | string): string {
  const found = PAYMENT_METHODS.find((m) => m.id === id);
  return found?.label ?? id;
}
