import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accountIssue, accountSnapshot, actionsForQuestion, duplicateCharge } from "./account-issue.ts";

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
});
