import assert from "node:assert/strict";
import test from "node:test";
import { cancellationAllowed, cancellationSummary } from "./cancellation.ts";

test("a preset cancellation reason is stored as that label", () => {
  assert.equal(cancellationSummary("Too expensive", ""), "Too expensive");
});

test("an overdue membership can be cancelled with a reason", () => {
  assert.deepEqual(cancellationAllowed("OVERDUE", "  Too expensive  "), { ok: true, reason: "Too expensive" });
});

test("a blank reason or an already cancelled membership is rejected", () => {
  assert.deepEqual(cancellationAllowed("ACTIVE", "   "), { ok: false, code: "INVALID", error: "Add a reason for the cancellation" });
  assert.deepEqual(cancellationAllowed("CANCELLED", "Too expensive"), { ok: false, code: "CONFLICT", error: "This membership is already cancelled" });
});

test("other requires a note and keeps the reason prefix", () => {
  assert.equal(cancellationSummary("Other", "   "), "");
  assert.equal(cancellationSummary("Other", "Moved away"), "Other: Moved away");
});
