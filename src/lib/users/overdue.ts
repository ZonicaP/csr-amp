export function paymentLinkDescription(
  purchase: { description: string; failureReason: string | null } | null,
  vehicleName: string,
): { ok: true; description: string } | { ok: false; error: "That failed payment could not be found" } {
  if (!purchase?.failureReason) return { ok: false, error: "That failed payment could not be found" };
  const name = vehicleName.trim();
  return { ok: true, description: name ? `${purchase.description} on ${name}` : purchase.description };
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
