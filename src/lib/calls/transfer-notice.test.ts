import assert from "node:assert/strict";
import test from "node:test";
import { clearStartedCall, readStartedCall, transferCallNotice, writeStartedCall } from "./transfer-notice.ts";

const unlinked = { reference: "C-10001", customer: null };
const linked = { reference: "C-10001", customer: { membershipId: "AMP-10001" } };

test("a transferred call names the reference and opens the customer list when unlinked", () => {
  assert.deepEqual(transferCallNotice({ call: unlinked, startedReference: null, dismissedReference: null }), {
    message: "C-10001 was transferred to you.",
    href: "/customers",
    action: "Open call",
  });
});

test("a linked transferred call opens that customer", () => {
  assert.equal(
    transferCallNotice({ call: linked, startedReference: null, dismissedReference: null })?.href,
    "/customers/AMP-10001",
  );
});

test("the previous CSR is named only when that name is already known", () => {
  assert.equal(
    transferCallNotice({ call: unlinked, fromName: "Alex Morgan", startedReference: null, dismissedReference: null })?.message,
    "C-10001 was transferred to you from Alex Morgan.",
  );
  assert.equal(
    transferCallNotice({ call: unlinked, fromName: "  ", startedReference: null, dismissedReference: null })?.message,
    "C-10001 was transferred to you.",
  );
});

test("a call this CSR started does not look like a transfer", () => {
  assert.equal(transferCallNotice({ call: unlinked, startedReference: "C-10001", dismissedReference: null }), null);
  assert.equal(transferCallNotice({ call: unlinked, startedReference: null, dismissedReference: null, starting: true }), null);
});

test("dismiss hides this call until the next load and does not end it", () => {
  assert.equal(transferCallNotice({ call: unlinked, startedReference: null, dismissedReference: "C-10001" }), null);
  assert.equal(transferCallNotice({ call: { ...unlinked, reference: "C-10002" }, startedReference: null, dismissedReference: "C-10001" })?.action, "Open call");
});

test("no open call does not notify", () => {
  assert.equal(transferCallNotice({ call: null, startedReference: null, dismissedReference: null }), null);
});

test("the started-call marker is only the reference", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  writeStartedCall(storage, "C-10001");
  assert.equal(readStartedCall(storage), "C-10001");
  clearStartedCall(storage);
  assert.equal(readStartedCall(storage), null);
});
