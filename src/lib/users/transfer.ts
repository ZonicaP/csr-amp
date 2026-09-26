type TransferCode = "NOT_FOUND" | "CONFLICT" | "INVALID";

export function transferPlan(input: {
  plan: { status: "ACTIVE" | "CANCELLED"; planName: string; vehicleId: string; vehicleLabel: string; membershipId: string } | null;
  destinationVehicleId: string;
  destination: { vehicleLabel: string; membershipId: string; status: "ACTIVE" | "OVERDUE" | "CANCELLED"; hasSamePlan: boolean } | null;
}): { ok: true; summary: string } | { ok: false; code: TransferCode; error: string } {
  if (!input.plan) return { ok: false, code: "NOT_FOUND", error: "That plan could not be found" };
  if (input.plan.status !== "ACTIVE") return { ok: false, code: "CONFLICT", error: "That plan is not active" };
  if (input.destinationVehicleId === input.plan.vehicleId) return { ok: false, code: "INVALID", error: "Choose a different vehicle" };
  if (!input.destination) return { ok: false, code: "NOT_FOUND", error: "That vehicle could not be found" };
  if (input.destination.status === "CANCELLED") return { ok: false, code: "CONFLICT", error: "That membership is cancelled" };
  if (input.destination.hasSamePlan) return { ok: false, code: "CONFLICT", error: "That vehicle already has this plan" };
  const summary = `${input.plan.planName} moved from ${input.plan.vehicleLabel} on ${input.plan.membershipId} to ${input.destination.vehicleLabel} on ${input.destination.membershipId}.`.slice(0, 500);
  return { ok: true, summary };
}
