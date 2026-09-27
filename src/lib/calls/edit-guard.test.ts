import assert from "node:assert/strict";
import test from "node:test";
import { callEditNotice, heldByOtherAgent } from "./edit-guard.ts";

const call = { reference: "C-10001", customer: null };

test("an unlinked open call names the reference and offers a link", () => {
  assert.deepEqual(callEditNotice(call, "AMP-00001"), {
    kind: "unlinked",
    title: "Call not linked",
    message: "C-10001 is not linked to this customer yet.",
    canLink: true,
  });
});

test("a call linked to this customer does not warn", () => {
  assert.equal(callEditNotice({ reference: "C-10001", customer: { membershipId: "amp-00001" } }, "AMP-00001"), null);
});

test("a call linked to someone else warns without a link action", () => {
  assert.deepEqual(callEditNotice({ reference: "C-10001", customer: { membershipId: "AMP-00002" } }, "AMP-00001"), {
    kind: "other",
    title: "Call already linked",
    message: "C-10001 is already linked to someone else.",
    canLink: false,
  });
});

test("no open call does not warn", () => {
  assert.equal(callEditNotice(null, "AMP-00001"), null);
});

const live = [
  { reference: "C-20002", membershipId: "AMP-00009", csrId: "csr-2", csrName: "Alex Morgan" },
  { reference: "C-10001", membershipId: "AMP-00001", csrId: "csr-1", csrName: "Zonica Pietersen" },
];

test("a customer on another CSR's call cannot be linked", () => {
  assert.deepEqual(heldByOtherAgent("AMP-00009", "C-10001", null, live), { reference: "C-20002", agent: "Alex Morgan" });
  assert.deepEqual(callEditNotice(call, "AMP-00009", { reference: "C-20002", agent: "Alex Morgan" }), {
    kind: "unlinked",
    title: "Already on a call",
    message: "This customer is already on C-20002 with Alex Morgan.",
    canLink: false,
  });
});

test("the CSR who already has the customer can keep that link", () => {
  assert.equal(heldByOtherAgent("AMP-00001", "C-10001", { reference: "C-10001", agent: "Zonica Pietersen" }, live), null);
  assert.equal(heldByOtherAgent("AMP-00001", "C-10001", { reference: "C-10001", agent: "Zonica Pietersen" }, null), null);
});

test("before the live list arrives, the server hold still blocks a second link", () => {
  assert.deepEqual(heldByOtherAgent("AMP-00009", "C-10001", { reference: "C-20002", agent: "Alex Morgan" }, null), {
    reference: "C-20002",
    agent: "Alex Morgan",
  });
});
