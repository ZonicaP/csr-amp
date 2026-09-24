const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export type AccountStatus = "ACTIVE" | "OVERDUE" | "CANCELLED";

export type SuggestedAction =
  | { type: "email-payment-link"; purchaseId: string }
  | { type: "reactivate-membership" }
  | { type: "cancel-membership" }
  | { type: "offer-discount" }
  | { type: "email-plate-documents"; vehicleId: string }
  | { type: "refund-charge"; purchaseId: string };

export type AccountIssue = {
  tone: "warning" | "success" | "neutral";
  headline: string;
  detail: string;
  actions: SuggestedAction[];
};

export type AccountSnapshot = {
  name: string;
  membershipId: string;
  status: AccountStatus;
  joined: string;
  vehicles: { id: string; name: string; plate: string | null; plans: { name: string; status: string; since: string }[] }[];
  payments: { id: string; description: string; amount: string; date: string; failureReason: string | null }[];
  logs: { summary: string; date: string }[];
};

type AccountRecord = {
  firstName: string;
  lastName: string;
  membershipId: string;
  status: AccountStatus;
  createdAt: Date;
  vehicles: {
    id: string;
    year: number | null;
    make: string | null;
    model: string | null;
    licensePlate: string | null;
    subscriptions: { planName: string; status: string; startedAt: Date }[];
  }[];
  purchases: { id: string; description: string; amount: { toString(): string }; failureReason: string | null; purchasedAt: Date }[];
  events: { summary: string; createdAt: Date }[];
};

function vehicleName(vehicle: AccountRecord["vehicles"][number]) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle";
}

export function accountSnapshot(customer: AccountRecord): AccountSnapshot {
  return {
    name: `${customer.firstName} ${customer.lastName}`,
    membershipId: customer.membershipId,
    status: customer.status,
    joined: date.format(customer.createdAt),
    vehicles: customer.vehicles.map((vehicle) => ({
      id: vehicle.id,
      name: vehicleName(vehicle),
      plate: vehicle.licensePlate,
      plans: vehicle.subscriptions.map((plan) => ({
        name: plan.planName,
        status: plan.status,
        since: date.format(plan.startedAt),
      })),
    })),
    payments: customer.purchases.map((purchase) => ({
      id: purchase.id,
      description: purchase.description,
      amount: money.format(Number(purchase.amount)),
      date: date.format(purchase.purchasedAt),
      failureReason: purchase.failureReason,
    })),
    logs: customer.events.map((event) => ({
      summary: event.summary,
      date: date.format(event.createdAt),
    })),
  };
}

const duplicateWindowMs = 2 * 24 * 60 * 60 * 1000;

export function duplicateCharge(account: AccountSnapshot) {
  const paid = account.payments.filter((payment) => !payment.failureReason);
  for (const charge of paid) {
    const chargedAt = Date.parse(charge.date);
    const earlier = paid.find((other) => {
      if (other.id === charge.id || other.amount !== charge.amount) return false;
      const gap = Math.abs(chargedAt - Date.parse(other.date));
      return gap <= duplicateWindowMs && chargedAt >= Date.parse(other.date);
    });
    if (earlier) return charge;
  }
  return null;
}

export function accountIssue(account: AccountSnapshot): AccountIssue {
  const failed = account.payments.find((payment) => payment.failureReason);
  const paid = account.payments.find((payment) => !payment.failureReason);
  if (account.status === "OVERDUE") {
    return {
      tone: "warning",
      headline: "Payment outstanding",
      detail: failed
        ? `Declined ${failed.amount} on ${failed.date}. ${failed.failureReason}`
        : "This account is overdue and the latest charge did not go through.",
      actions: failed ? [{ type: "email-payment-link", purchaseId: failed.id }] : [],
    };
  }
  if (account.status === "CANCELLED") {
    const cancelled = account.logs.find((event) => /cancel/i.test(event.summary));
    return {
      tone: "neutral",
      headline: "Membership cancelled",
      detail: cancelled?.summary ?? "This membership is cancelled, so a wash will not start.",
      actions: [{ type: "reactivate-membership" }],
    };
  }
  const duplicate = duplicateCharge(account);
  if (duplicate) {
    return {
      tone: "warning",
      headline: "Charged twice",
      detail: `A second ${duplicate.description} charge of ${duplicate.amount} on ${duplicate.date} looks like a duplicate.`,
      actions: [{ type: "refund-charge", purchaseId: duplicate.id }],
    };
  }
  return {
    tone: "success",
    headline: "No billing issue stands out",
    detail: paid ? `Last payment of ${paid.amount} on ${paid.date} went through.` : "This account is active.",
    actions: [],
  };
}

export function actionsForQuestion(account: AccountSnapshot, question: string): SuggestedAction[] {
  const text = question.toLowerCase();
  const actions: SuggestedAction[] = [];
  const failed = account.payments.find((payment) => payment.failureReason);
  const duplicate = duplicateCharge(account);
  const vehicle = account.vehicles[0];
  if (/cancel/.test(text) && account.status !== "CANCELLED") {
    actions.push({ type: "cancel-membership" }, { type: "offer-discount" });
  }
  if (/reactivat|plate|vehicle/.test(text) && account.status === "CANCELLED") {
    actions.push({ type: "reactivate-membership" });
  }
  if (/plate|vehicle number|wrong vehicle/.test(text) && vehicle) {
    actions.push({ type: "email-plate-documents", vehicleId: vehicle.id });
  }
  if (/twice|double charge|refund/.test(text) && duplicate) {
    actions.push({ type: "refund-charge", purchaseId: duplicate.id });
  }
  if (/declin|outstanding|didn't start|did not start/.test(text) && account.status === "OVERDUE" && failed) {
    actions.push({ type: "email-payment-link", purchaseId: failed.id });
  }
  return actions;
}
