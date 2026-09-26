export const cancellationReasons = [
  "Too expensive",
  "No longer needs the membership",
  "Switching to another provider",
  "Vehicle sold or no longer owned",
  "Service did not meet expectations",
  "Other",
] as const;

export const cancellationReasonLimit = 200;
const otherPrefix = "Other: ";

export function cancellationReason(reason: string): { ok: true; reason: string } | { ok: false; error: string } {
  const text = reason.trim();
  if (!text || text.length > cancellationReasonLimit) return { ok: false, error: "Add a reason for the cancellation" };
  return { ok: true, reason: text };
}

export function cancellationAllowed(status: "ACTIVE" | "OVERDUE" | "CANCELLED", reason: string) {
  const parsed = cancellationReason(reason);
  if (!parsed.ok) return { ok: false as const, code: "INVALID" as const, error: parsed.error };
  if (status === "CANCELLED") return { ok: false as const, code: "CONFLICT" as const, error: "This membership is already cancelled" };
  return { ok: true as const, reason: parsed.reason };
}

export function cancellationSummary(reason: string, notes: string) {
  if (reason !== "Other") return reason.trim();
  const text = notes.trim();
  return text ? `${otherPrefix}${text}`.slice(0, cancellationReasonLimit) : "";
}
