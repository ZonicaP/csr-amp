const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export type AccountStatus = "ACTIVE" | "OVERDUE" | "CANCELLED";

export type SuggestedAction =
  | { type: "email-payment-link"; purchaseId: string }
  | { type: "reactivate-membership" }
  | { type: "cancel-membership" }
  | { type: "offer-discount" }
  | { type: "email-plate-documents" }
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
  const seen = new Set<string>();
  const add = (action: SuggestedAction) => {
    const key = "purchaseId" in action ? `${action.type}:${action.purchaseId}` : action.type;
    if (seen.has(key)) return;
    seen.add(key);
    actions.push(action);
  };
  if (/cancel/.test(text) && account.status !== "CANCELLED") {
    add({ type: "cancel-membership" });
    add({ type: "offer-discount" });
  }
  if (/reactivat|plate|vehicle/.test(text) && account.status === "CANCELLED") {
    add({ type: "reactivate-membership" });
  }
  if (/plate|vehicle number|wrong vehicle/.test(text)) {
    add({ type: "email-plate-documents" });
  }
  if (/twice|double charge|refund/.test(text) && duplicate) {
    add({ type: "refund-charge", purchaseId: duplicate.id });
  }
  const overdueDecline = /declin|outstanding|didn't start|did not start/.test(text) && account.status === "OVERDUE";
  const cardUpdate = cardPattern.test(text);
  const blockedCheckout = (couponPattern.test(text) || singleWashPattern.test(text)) && account.status === "OVERDUE";
  if (failed && (overdueDecline || cardUpdate || blockedCheckout)) {
    add({ type: "email-payment-link", purchaseId: failed.id });
  }
  return actions;
}

export type DebugReply = {
  likelyIssue: string;
  summary: string;
  steps: string[];
};

const couponPattern = /coupon|promo code|\bpromo\b/;
const singleWashPattern = /single wash|one-time wash|one time wash/;
const cardPattern = /update( my| the| their)? card|change( my| the| their)? card|new card|card (was |is |got )?declin|card expir/;

export function answersWithoutModel(question: string) {
  const text = question.toLowerCase();
  return couponPattern.test(text) || singleWashPattern.test(text) || cardPattern.test(text);
}

function planNames(account: AccountSnapshot) {
  return [...new Set(account.vehicles.flatMap((vehicle) => vehicle.plans.map((plan) => plan.name)))];
}

function planPhrase(account: AccountSnapshot) {
  const names = planNames(account);
  if (names.length === 0) return "No plan is on file";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function planIs(account: AccountSnapshot) {
  const names = planNames(account);
  const word = statusWord(account.status);
  if (names.length === 0) return `No plan is on file and the account is ${word}`;
  if (names.length === 1) return `${names[0]} is ${word}`;
  return `${planPhrase(account)} are ${word}`;
}

function statusWord(status: AccountStatus) {
  if (status === "OVERDUE") return "overdue";
  if (status === "CANCELLED") return "cancelled";
  return "active";
}

function failedCharge(account: AccountSnapshot) {
  return account.payments.find((payment) => payment.failureReason) ?? null;
}

function couponMentions(account: AccountSnapshot) {
  const lines: string[] = [];
  for (const payment of account.payments) {
    if (/coupon|promo/i.test(payment.description)) lines.push(`${payment.description} (${payment.amount} on ${payment.date})`);
  }
  for (const log of account.logs) {
    if (/coupon|promo/i.test(log.summary)) lines.push(`${log.summary} (${log.date})`);
  }
  return lines;
}

function couponFact(account: AccountSnapshot) {
  const mentions = couponMentions(account);
  if (mentions.length === 0) {
    return "No purchase or event on this account mentions a coupon, so there is no unused coupon and no expiry date on file.";
  }
  return `The account mentions a coupon here: ${mentions.join("; ")}. No separate expiry date is stored.`;
}

function singleWashPayments(account: AccountSnapshot) {
  return account.payments.filter((payment) => singleWashPattern.test(payment.description.toLowerCase()));
}

function reply(likelyIssue: string, summary: string, steps: Array<string | false>): DebugReply {
  const kept = steps.filter((step): step is string => Boolean(step)).slice(0, 4);
  return { likelyIssue, summary, steps: kept.length > 0 ? kept : [summary] };
}

function couponAnswer(account: AccountSnapshot, question: string): DebugReply {
  const plan = planPhrase(account);
  const failed = failedCharge(account);
  const fact = couponFact(account);
  const unlimited = planNames(account).find((name) => /unlimited/i.test(name));
  const stack = unlimited
    ? `A coupon does not stack on ${unlimited} and can apply only to a single wash, before tax.`
    : `A coupon does not stack on ${plan} and can apply only to a single wash, before tax.`;
  const charge = failed ? `A charge of ${failed.amount} on ${failed.date} failed: ${failed.failureReason}.` : "";
  const ask = "Ask for the code and the expiry they see in the AMP app. Do not promise a discount.";
  const untilActive = planNames(account).length === 1 ? `until ${plan} is active` : "until the membership is active";

  if (account.status === "OVERDUE" || account.status === "CANCELLED") {
    const word = statusWord(account.status);
    return reply(
      `Coupon will not apply while the membership is ${word}.`,
      `${planIs(account)}, so a coupon will not apply at the wash. ${charge} ${fact}`.replace(/\s+/g, " ").trim(),
      [
        `Tell the customer the coupon will not apply ${untilActive}.`,
        failed
          ? `Email the payment link for the ${failed.amount} charge. The customer updates the card in the AMP app.`
          : `The membership wash will not start until the account is active.`,
        ask,
        /expir|used/.test(question)
          ? couponMentions(account).length > 0
            ? "Use only the coupon text already on the account. Do not add a code or expiry that is not written there."
            : "An expired or already-used coupon will not apply. Do not promise a discount that is not on this account."
          : stack,
      ],
    );
  }

  if (/expir|already used|used up/.test(question)) {
    const mentioned = couponMentions(account).length > 0;
    return reply(
      mentioned ? "The coupon on this account has no stored expiry." : "No unused coupon is on this account.",
      `${fact} An expired or already-used coupon will not apply at the wash. ${planIs(account)}. ${stack}`,
      [
        ask,
        "An expired or already-used coupon will not apply at the wash.",
        stack,
        "The customer redeems coupons in the AMP app, not in this portal.",
      ],
    );
  }

  return reply(
    unlimited ? `Coupon does not stack on ${unlimited}.` : "Coupon does not stack on the active membership.",
    `${planIs(account)}. ${stack} ${fact}`,
    [
      `Confirm the coupon was for a single wash, not a discount on ${plan}.`,
      "A coupon applies before tax and does not stack on an unlimited or other active membership plan.",
      ask,
      "An expired coupon will not apply at the wash. The customer redeems it in the AMP app.",
    ],
  );
}

function singleWashAnswer(account: AccountSnapshot): DebugReply {
  const plan = planPhrase(account);
  const washes = singleWashPayments(account);
  const failed = failedCharge(account);
  const washFact = washes.length
    ? `Purchase history shows a single wash: ${washes.map((wash) => `${wash.description} ${wash.amount} on ${wash.date}${wash.failureReason ? ` (${wash.failureReason})` : ""}`).join("; ")}.`
    : "No single-wash purchase is on this account.";
  const word = statusWord(account.status);

  if (account.status === "OVERDUE" || account.status === "CANCELLED") {
    return reply(
      "Membership wash will not start until the account is active.",
      `${plan} is ${word}. A single wash can still be bought in the AMP app, but the membership wash will not start until the account is active. ${washFact}`,
      [
        "A single wash is a one-time purchase in the AMP app, separate from the monthly membership.",
        `The membership wash on ${plan} will not start while the account is ${word}.`,
        failed ? `Email the payment link for the failed ${failed.amount} charge on ${failed.date}.` : "There is no failed charge on file to send a payment link for.",
        washes.length ? "Use the single-wash purchase above. Do not describe it as the monthly plan." : "Do not invent a single-wash purchase that is not on the account.",
      ],
    );
  }

  return reply(
    "Single wash is separate from the monthly membership.",
    `${plan} is the monthly membership and it is active. ${washFact} A single wash does not replace that plan.`,
    [
      washes.length
        ? "Point to the single-wash purchase in history, and keep it separate from the monthly plan."
        : `No single wash is on file. ${plan} is the membership, not a one-time wash.`,
      "The customer buys a single wash in the AMP app.",
      "A single wash is charged once. It is not the monthly membership renewal.",
    ],
  );
}

function cardAnswer(account: AccountSnapshot): DebugReply {
  const failed = failedCharge(account);
  const standing = accountIssue(account);
  if (!failed) {
    return reply(
      "Card changes happen in the AMP app.",
      `The customer updates their card in the AMP app. This portal does not edit the card number. ${standing.detail}`,
      [
        "Tell the customer to update the card in the AMP app.",
        "Do not ask for or type the card number in this portal.",
        "No failed charge is on this account, so there is no payment link to send.",
      ],
    );
  }
  return reply(
    "Customer updates the card in the AMP app.",
    `The customer updates their card in the AMP app. This portal does not edit the card number. A charge of ${failed.amount} on ${failed.date} failed: ${failed.failureReason}. Email the payment link for that charge.`,
    [
      "Tell the customer to update the card in the AMP app.",
      `Email the payment link for the ${failed.amount} charge that failed on ${failed.date}.`,
      "Do not ask for or type the card number in this portal.",
      account.status === "OVERDUE" ? "The membership stays overdue until that payment succeeds." : "The next membership charge uses the card saved in the AMP app.",
    ],
  );
}

function plateAnswer(account: AccountSnapshot): DebugReply {
  const plates = account.vehicles.map((vehicle) => (vehicle.plate ? `${vehicle.name} plate ${vehicle.plate}` : `${vehicle.name} has no plate on file`));
  return reply(
    "Plate on file needs a check.",
    plates.length ? `Vehicles on this account: ${plates.join("; ")}.` : "No vehicle is on this account.",
    [
      "Email plate documents so the customer can confirm the plate.",
      "Compare the plate they read on the call with the plate on file.",
      "Leave the plate as it is until the documents match.",
    ],
  );
}

function cancelAnswer(account: AccountSnapshot): DebugReply {
  if (account.status === "CANCELLED") {
    const standing = accountIssue(account);
    return reply(standing.headline, standing.detail, [
      "The membership is already cancelled.",
      "Reactivate only if the customer wants the plan back.",
    ]);
  }
  const word = statusWord(account.status);
  return reply("Customer wants to cancel.", `${planPhrase(account)} is ${word}. Cancelling stops the membership wash. A discount can be offered before cancelling.`, [
    "Confirm they want to cancel.",
    "Offer a discount if that would keep the membership.",
    "Cancel only after they confirm.",
  ]);
}

function duplicateAnswer(account: AccountSnapshot): DebugReply {
  const duplicate = duplicateCharge(account);
  if (!duplicate) {
    return reply("No duplicate charge stands out.", "No second charge of the same amount within two days is on this account.", [
      "Review the payment list with the customer.",
      "Request a refund only when a duplicate charge is on the account.",
    ]);
  }
  return reply(
    "Charged twice",
    `A second ${duplicate.description} charge of ${duplicate.amount} on ${duplicate.date} looks like a duplicate.`,
    ["Request a refund for that second charge.", "Confirm the two charges with the customer before sending the refund."],
  );
}

function billingAnswer(account: AccountSnapshot): DebugReply {
  const standing = accountIssue(account);
  const failed = failedCharge(account);
  return reply(standing.headline, standing.detail, [
    failed && account.status === "OVERDUE" ? `Email the payment link for the ${failed.amount} charge on ${failed.date}.` : false,
    failed && account.status === "OVERDUE" ? "The customer updates the card in the AMP app. Do not collect the card number here." : false,
    standing.headline === "Charged twice" ? "Request a refund for the duplicate charge." : false,
    account.status === "CANCELLED" ? "The membership is cancelled, so a wash will not start." : false,
    standing.headline === "No billing issue stands out" ? standing.detail : false,
    standing.headline === "No billing issue stands out" ? "Ask what the customer saw at the wash if they still report a problem." : false,
    !failed && account.status === "OVERDUE" ? "The account is overdue. A wash will not start until a payment succeeds." : false,
  ]);
}

export function fallbackDebugAnswer(account: AccountSnapshot, question: string): DebugReply {
  const text = question.toLowerCase();
  if (couponPattern.test(text)) return couponAnswer(account, text);
  if (singleWashPattern.test(text)) return singleWashAnswer(account);
  if (cardPattern.test(text)) return cardAnswer(account);
  if (/plate|vehicle number|wrong vehicle/.test(text)) return plateAnswer(account);
  if (/twice|double charge|refund/.test(text)) return duplicateAnswer(account);
  if (/cancel/.test(text)) return cancelAnswer(account);
  if (/declin|outstanding|didn't start|did not start|wash/.test(text)) return billingAnswer(account);
  const standing = accountIssue(account);
  return reply(standing.headline, standing.detail, [standing.detail, "Ask a follow-up about the wash, payment, plate, coupon, or card if this does not match what the customer said."]);
}
