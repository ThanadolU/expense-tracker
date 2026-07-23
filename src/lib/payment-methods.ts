/**
 * Payment methods for expenses (Phase 5B).
 * Keep in sync with Prisma `enum PaymentMethod`.
 */

export const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", short: "Cash", color: "#65a30d", monogram: "฿" },
  {
    id: "KTB",
    label: "KTB (Krungthai Bank)",
    short: "KTB",
    color: "#1d4ed8",
    monogram: "KTB",
  },
  {
    id: "SCB",
    label: "SCB (Siam Commercial Bank)",
    short: "SCB",
    color: "#4c1d95",
    monogram: "SCB",
  },
  {
    id: "BBL",
    label: "BBL (Bangkok Bank)",
    short: "BBL",
    color: "#1e3a8a",
    monogram: "BBL",
  },
  {
    id: "KBANK",
    label: "KBank (Kasikornbank)",
    short: "KBank",
    color: "#15803d",
    monogram: "KB",
  },
  {
    id: "BAY",
    label: "BAY (Krungsri / Bank of Ayudhya)",
    short: "BAY",
    color: "#ea580c",
    monogram: "BAY",
  },
  {
    id: "TTB",
    label: "TTB (TMBThanachart)",
    short: "TTB",
    color: "#0f766e",
    monogram: "TTB",
  },
  {
    id: "GSB",
    label: "GSB (Government Savings Bank)",
    short: "GSB",
    color: "#b45309",
    monogram: "GSB",
  },
  {
    id: "BAAC",
    label: "BAAC (Bank for Agriculture)",
    short: "BAAC",
    color: "#65a30d",
    monogram: "BAC",
  },
  {
    id: "CIMB",
    label: "CIMB (CIMB Thai)",
    short: "CIMB",
    color: "#dc2626",
    monogram: "CIM",
  },
  {
    id: "UOB",
    label: "UOB (UOB Thailand)",
    short: "UOB",
    color: "#1d4ed8",
    monogram: "UOB",
  },
  {
    id: "LH",
    label: "LH (Land and Houses Bank)",
    short: "LH",
    color: "#c2410c",
    monogram: "LH",
  },
  {
    id: "ICBC",
    label: "ICBC (ICBC Thai)",
    short: "ICBC",
    color: "#b91c1c",
    monogram: "IC",
  },
  {
    id: "CITI",
    label: "CITI (Citibank)",
    short: "CITI",
    color: "#0369a1",
    monogram: "Citi",
  },
  {
    id: "PROMPTPAY",
    label: "PromptPay",
    short: "PromptPay",
    color: "#0369a1",
    monogram: "PP",
  },
  {
    id: "OTHER",
    label: "Other",
    short: "Other",
    color: "#52525b",
    monogram: "…",
  },
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

export function getPaymentMethodMeta(id: PaymentMethodId | string) {
  return (
    PAYMENT_METHODS.find((m) => m.id === id) ?? {
      id: "OTHER" as const,
      label: id,
      short: id,
      color: "#52525b",
      monogram: "?",
    }
  );
}

export function paymentMethodLabel(id: PaymentMethodId | string): string {
  return getPaymentMethodMeta(id).label;
}

/** Short label for tight list UI. */
export function paymentMethodShortLabel(id: PaymentMethodId | string): string {
  return getPaymentMethodMeta(id).short;
}
