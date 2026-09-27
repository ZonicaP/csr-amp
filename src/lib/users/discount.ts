export const offerPeriods = [
  { value: "1-month", label: "1 month" },
  { value: "3-months", label: "3 months" },
  { value: "6-months", label: "6 months" },
  { value: "1-year", label: "1 year" },
] as const;

export type OfferPeriod = (typeof offerPeriods)[number]["value"];

export function maxDiscountPercent(roles: readonly string[]): number | null {
  return roles.includes("ADMIN") ? null : 10;
}

export function discountPhrase(percent: number, periodLabel: string) {
  return `${percent}% off for ${periodLabel}`;
}

export function storedDiscount(
  percent: number | null | undefined,
  period: string | null | undefined,
): { percent: number; period: OfferPeriod; label: string } | null {
  if (percent == null || period == null) return null;
  const match = offerPeriods.find((item) => item.value === period);
  if (!match || !Number.isInteger(percent) || percent < 1 || percent > 100) return null;
  return { percent, period: match.value, label: match.label };
}

export function parseOfferDiscount(
  percent: unknown,
  period: unknown,
  roles: readonly string[],
): { percent: number; period: OfferPeriod; label: string } | { error: string } {
  const value = typeof percent === "number" ? percent : typeof percent === "string" && percent.trim() !== "" ? Number(percent) : Number.NaN;
  if (!Number.isInteger(value) || value < 1 || value > 100) return { error: "Enter a discount from 1 to 100" };
  const cap = maxDiscountPercent(roles);
  if (cap !== null && value > cap) return { error: `This role can offer up to ${cap}%` };
  const match = offerPeriods.find((item) => item.value === period);
  if (!match) return { error: "Choose how long the discount lasts" };
  return { percent: value, period: match.value, label: match.label };
}
