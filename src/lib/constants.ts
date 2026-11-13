/** Default currency for new expenses (Phase 2 — single-currency MVP). */
export const DEFAULT_CURRENCY = "THB" as const;

/** Default category names for household shared expenses */
export const HOUSEHOLD_CATEGORIES = [
  "Groceries",
  "Utilities",
  "Rent & Housing",
  "Dining Out",
  "Entertainment",
  "Household Supplies",
  "Transportation",
  "Other",
] as const;

export type HouseholdCategory = (typeof HOUSEHOLD_CATEGORIES)[number];

