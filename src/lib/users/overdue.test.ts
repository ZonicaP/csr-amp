import assert from "node:assert/strict";
import test from "node:test";
import { overduePaymentDue, paymentLinkDescription, settledOverduePayment } from "./overdue.ts";

const failed = { description: "Unlimited Wash", failureReason: "Card expired" };

test("a failed charge on an overdue account can take a payment link", () => {
  assert.deepEqual(paymentLinkDescription(failed, "2022 Tesla Model 3"), { ok: true, description: "Unlimited Wash on 2022 Tesla Model 3" });
  assert.deepEqual(overduePaymentDue("OVERDUE", failed, "2022 Tesla Model 3"), { description: "Unlimited Wash on 2022 Tesla Model 3" });
});

test("paying an overdue charge records the amount and clears the block", () => {
  assert.deepEqual(settledOverduePayment({ status: "OVERDUE", purchase: { description: "Unlimited Wash", amount: "$19.99", failureReason: "Card expired" } }), {
    ok: true,
    summary: "Payment of $19.99 received for Unlimited Wash. Membership is active.",
  });
});

test("a paid charge or an account that is not overdue does not get a payment link", () => {
  assert.deepEqual(paymentLinkDescription({ description: "Unlimited Wash", failureReason: null }, "Tesla"), { ok: false, error: "That failed payment could not be found" });
  assert.equal(overduePaymentDue("ACTIVE", failed, "Tesla"), null);
  assert.equal(overduePaymentDue("OVERDUE", { description: "Unlimited Wash", failureReason: null }, "Tesla"), null);
  assert.deepEqual(settledOverduePayment({ status: "ACTIVE", purchase: { ...failed, amount: "$19.99" } }), { ok: false, error: "Nothing is due on this membership" });
  assert.deepEqual(settledOverduePayment({ status: "OVERDUE", purchase: null }), { ok: false, error: "Nothing is due on this membership" });
});
