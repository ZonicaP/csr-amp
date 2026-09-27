import assert from "node:assert/strict";
import test from "node:test";
import { callEditNotice } from "./edit-guard.ts";

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
