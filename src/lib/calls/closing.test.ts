import assert from "node:assert/strict";
import test from "node:test";
import { closingCall } from "./closing.ts";

test("ending a call requires both closing steps", () => {
  const message = { ok: false, error: "Confirm both closing steps before ending the call" };
  assert.deepEqual(closingCall({ gaveReference: true, confirmedNothingElse: false }), message);
  assert.deepEqual(closingCall({ gaveReference: false, confirmedNothingElse: true, notes: "left a note" }), message);
});

test("a confirmed call closes and keeps a trimmed note", () => {
  assert.deepEqual(closingCall({ gaveReference: true, confirmedNothingElse: true, notes: "  caller was happy  " }), {
    ok: true,
    status: "CLOSED",
    gaveReference: true,
    confirmedNothingElse: true,
    closingNotes: "caller was happy",
  });
  assert.deepEqual(closingCall({ gaveReference: true, confirmedNothingElse: true, notes: "   " }), {
    ok: true,
    status: "CLOSED",
    gaveReference: true,
    confirmedNothingElse: true,
    closingNotes: null,
  });
  const longNote = closingCall({ gaveReference: true, confirmedNothingElse: true, notes: "x".repeat(1200) });
  assert.equal(longNote.ok ? longNote.closingNotes?.length : 0, 1000);
});
