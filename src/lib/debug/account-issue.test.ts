import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accountIssue, accountSnapshot, actionsForQuestion, duplicateCharge, fallbackDebugAnswer } from "./account-issue.ts";

const opened = new Date(Date.UTC(2024, 0, 15, 16));

function customer(status: "ACTIVE" | "OVERDUE" | "CANCELLED") {
  return accountSnapshot({
    firstName: "Amelia",
    lastName: "Keller",
    membershipId: "AMP-10041",
    status,
    createdAt: opened,
    vehicles: [
      {
        id: "vehicle-1",
        year: 2019,
        make: "Honda",
        model: "Civic",
        licensePlate: "AMP1040",
        subscriptions: [{ planName: "Basic Wash", status: status === "CANCELLED" ? "CANCELLED" : "ACTIVE", startedAt: opened }],
      },
    ],
    purchases: [
      {
        id: "purchase-1",
        description: "Basic Wash",
        amount: 29,
        failureReason: status === "OVERDUE" ? "Card expired" : null,
        purchasedAt: new Date(Date.UTC(2025, 5, 12, 16)),
      },
    ],
    events:
      status === "CANCELLED"
        ? [{ summary: "Membership cancelled at the customer's request.", createdAt: new Date(Date.UTC(2025, 5, 12, 16)) }]
        : [{ summary: "Account opened.", createdAt: opened }],
  });
}

describe("account issue", () => {
  it("calls out an overdue account and the decline reason", () => {
    const issue = accountIssue(customer("OVERDUE"));
    assert.equal(issue.tone, "warning");
    assert.equal(issue.headline, "Payment outstanding");
    assert.match(issue.detail, /Card expired/);
    assert.match(issue.detail, /\$29\.00/);
    assert.deepEqual(issue.actions, [{ type: "email-payment-link", purchaseId: "purchase-1" }]);
  });

  it("treats an active account as up to date", () => {
    const issue = accountIssue(customer("ACTIVE"));
    assert.equal(issue.tone, "success");
    assert.equal(issue.headline, "No billing issue stands out");
    assert.match(issue.detail, /went through/);
    assert.deepEqual(issue.actions, []);
  });

  it("uses the cancellation log when the membership is cancelled", () => {
    const issue = accountIssue(customer("CANCELLED"));
    assert.equal(issue.tone, "neutral");
    assert.equal(issue.headline, "Membership cancelled");
    assert.match(issue.detail, /customer's request/);
    assert.deepEqual(issue.actions, [{ type: "reactivate-membership" }]);
  });

  it("offers cancel and a discount only when the customer wants to cancel", () => {
    const active = customer("ACTIVE");
    assert.deepEqual(actionsForQuestion(active, "Wants to cancel"), [
      { type: "cancel-membership" },
      { type: "offer-discount" },
    ]);
    assert.deepEqual(actionsForQuestion(active, "Wash didn't start"), []);
  });

  it("refunds only a second charge within two days", () => {
    const monthly = customer("ACTIVE");
    monthly.payments.push({
      id: "purchase-2",
      description: "Basic Wash",
      amount: "$29.00",
      date: "Jan 12, 2025",
      failureReason: null,
    });
    assert.equal(duplicateCharge(monthly), null);
    assert.deepEqual(actionsForQuestion(monthly, "Charged twice"), []);

    const doubled = customer("ACTIVE");
    doubled.payments.unshift({
      id: "purchase-2",
      description: "Basic Wash",
      amount: "$29.00",
      date: "Jun 13, 2025",
      failureReason: null,
    });
    assert.equal(duplicateCharge(doubled)?.id, "purchase-2");
    assert.deepEqual(actionsForQuestion(doubled, "Charged twice"), [{ type: "refund-charge", purchaseId: "purchase-2" }]);
    assert.equal(accountIssue(doubled).headline, "Charged twice");
  });

  it("asks for plate documents when the plate is wrong", () => {
    assert.deepEqual(actionsForQuestion(customer("ACTIVE"), "Wrong plate or vehicle"), [
      { type: "email-plate-documents" },
    ]);
  });

  it("emails a payment link when the customer needs a new card", () => {
    assert.deepEqual(actionsForQuestion(customer("OVERDUE"), "update my card"), [
      { type: "email-payment-link", purchaseId: "purchase-1" },
    ]);
    assert.deepEqual(actionsForQuestion(customer("OVERDUE"), "card declined"), [
      { type: "email-payment-link", purchaseId: "purchase-1" },
    ]);
    assert.deepEqual(actionsForQuestion(customer("ACTIVE"), "update my card"), []);
  });
});

describe("smart debug answers", () => {
  it("keeps overdue, cancel, duplicate, and plate answers", () => {
    const overdue = fallbackDebugAnswer(customer("OVERDUE"), "Payment was declined");
    assert.equal(overdue.likelyIssue, "Payment outstanding");
    assert.match(overdue.summary, /Card expired/);
    assert.match(overdue.steps.join(" "), /payment link/i);

    const cancel = fallbackDebugAnswer(customer("ACTIVE"), "Wants to cancel");
    assert.equal(cancel.likelyIssue, "Customer wants to cancel.");
    assert.match(cancel.summary, /Basic Wash/);

    const doubled = customer("ACTIVE");
    doubled.payments.unshift({
      id: "purchase-2",
      description: "Basic Wash",
      amount: "$29.00",
      date: "Jun 13, 2025",
      failureReason: null,
    });
    const duplicate = fallbackDebugAnswer(doubled, "Charged twice");
    assert.equal(duplicate.likelyIssue, "Charged twice");
    assert.match(duplicate.summary, /\$29\.00/);

    const plate = fallbackDebugAnswer(customer("ACTIVE"), "Wrong plate or vehicle");
    assert.match(plate.summary, /AMP1040/);
    assert.match(plate.steps.join(" "), /plate documents/i);
  });

  it("blocks a coupon while the membership is overdue and does not invent a code", () => {
    const answer = fallbackDebugAnswer(customer("OVERDUE"), "my coupon doesn't work");
    const text = `${answer.likelyIssue} ${answer.summary} ${answer.steps.join(" ")}`;
    assert.match(answer.likelyIssue, /overdue/i);
    assert.match(text, /Basic Wash/);
    assert.match(text, /Card expired/);
    assert.match(text, /\$29\.00/);
    assert.match(text, /no unused coupon|no purchase or event/i);
    assert.match(text, /payment link/i);
    assert.doesNotMatch(text, /code is|expires on|SAVE\d|WELCOME/i);
    assert.ok(answer.steps.length >= 2 && answer.steps.length <= 4);
    assert.deepEqual(actionsForQuestion(customer("OVERDUE"), "my coupon doesn't work"), [
      { type: "email-payment-link", purchaseId: "purchase-1" },
    ]);
  });

  it("treats an expired coupon as unused only when the account says so", () => {
    const answer = fallbackDebugAnswer(customer("ACTIVE"), "my coupon expired");
    const text = `${answer.likelyIssue} ${answer.summary} ${answer.steps.join(" ")}`;
    assert.match(answer.likelyIssue, /No unused coupon/i);
    assert.match(text, /Basic Wash/);
    assert.match(text, /expired or already-used/i);
    assert.match(text, /Do not promise a discount/);
    assert.match(text, /before tax/);
    assert.doesNotMatch(text, /code is|expires on|SAVE\d|WELCOME/i);
    assert.equal(actionsForQuestion(customer("ACTIVE"), "my coupon expired").length, 0);
  });

  it("quotes a coupon mention and still does not add an expiry", () => {
    const account = customer("ACTIVE");
    account.logs.unshift({ summary: "Single wash coupon noted at the bay.", date: "Mar 2, 2025" });
    const answer = fallbackDebugAnswer(account, "my coupon expired");
    assert.match(answer.likelyIssue, /no stored expiry/i);
    assert.match(answer.summary, /Single wash coupon noted at the bay/);
    assert.match(answer.summary, /No separate expiry date is stored/);
    assert.doesNotMatch(answer.summary, /expires on/i);
  });

  it("says a coupon does not stack on an unlimited plan", () => {
    const account = customer("ACTIVE");
    account.vehicles[0].plans[0].name = "Unlimited Wash";
    const answer = fallbackDebugAnswer(account, "coupon doesn't work");
    const text = `${answer.likelyIssue} ${answer.summary} ${answer.steps.join(" ")}`;
    assert.match(answer.likelyIssue, /does not stack/i);
    assert.match(text, /Unlimited Wash/);
    assert.match(text, /single wash/i);
    assert.match(text, /before tax/);
    assert.doesNotMatch(text, /SAVE\d|expires on/i);
  });

  it("separates a single wash from an overdue membership", () => {
    const account = customer("OVERDUE");
    account.payments.unshift({
      id: "purchase-wash",
      description: "Single wash",
      amount: "$10.00",
      date: "May 2, 2025",
      failureReason: null,
    });
    const answer = fallbackDebugAnswer(account, "single wash");
    const text = `${answer.summary} ${answer.steps.join(" ")}`;
    assert.match(text, /Single wash \$10\.00 on May 2, 2025/);
    assert.match(text, /AMP app/);
    assert.match(text, /will not start until the account is active/);
    assert.match(text, /Basic Wash/);
    assert.match(text, /one-time purchase/i);
    assert.doesNotMatch(text, /coupon code/i);
  });

  it("tells the customer to change the card in the AMP app", () => {
    for (const question of ["update my card", "card declined"]) {
      const answer = fallbackDebugAnswer(customer("OVERDUE"), question);
      const text = `${answer.summary} ${answer.steps.join(" ")}`;
      assert.match(text, /AMP app/);
      assert.match(text, /does not edit the card number/);
      assert.match(text, /Email the payment link/);
      assert.match(text, /Card expired/);
      assert.doesNotMatch(text, /enter the card|type the card number into this portal and save/i);
    }
    const current = fallbackDebugAnswer(customer("ACTIVE"), "update my card");
    assert.match(current.summary, /does not edit the card number/);
    assert.match(current.steps.join(" "), /No failed charge/);
  });
});
