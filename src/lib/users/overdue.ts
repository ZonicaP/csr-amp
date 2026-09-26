export function paymentLinkDescription(
  purchase: { description: string; failureReason: string | null } | null,
  vehicleName: string,
): { ok: true; description: string } | { ok: false; error: "That failed payment could not be found" } {
  if (!purchase?.failureReason) return { ok: false, error: "That failed payment could not be found" };
  const name = vehicleName.trim();
  return { ok: true, description: name ? `${purchase.description} on ${name}` : purchase.description };
}

export function settledOverduePayment(input: {
  status: "ACTIVE" | "OVERDUE" | "CANCELLED";
  purchase: { description: string; amount: string; failureReason: string | null } | null;
}) {
  if (input.status !== "OVERDUE" || !input.purchase?.failureReason) {
    return { ok: false as const, error: "Nothing is due on this membership" };
  }
  const summary = `Payment of ${input.purchase.amount} received for ${input.purchase.description}. Membership is active.`.slice(0, 500);
  return { ok: true as const, summary };
}

export function overduePaymentDue(
  status: "ACTIVE" | "OVERDUE" | "CANCELLED",
  purchase: { description: string; failureReason: string | null } | null,
  vehicleName: string,
) {
  if (status !== "OVERDUE") return null;
  const link = paymentLinkDescription(purchase, vehicleName);
  return link.ok ? { description: link.description } : null;
}
