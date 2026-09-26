import assert from "node:assert/strict";
import test from "node:test";
import { handoffAllowed } from "./handoff.ts";

const actorId = "csr-1";

test("an open call can move to another active CSR", () => {
  assert.deepEqual(
    handoffAllowed({ actorId, targetId: "csr-2", targetActive: true, targetHasOpenCall: false }),
    { ok: true },
  );
});

test("handoff rejects the same CSR, an inactive CSR, and a CSR already on a call", () => {
  assert.deepEqual(handoffAllowed({ actorId, targetId: actorId, targetActive: true, targetHasOpenCall: true }), {
    ok: false,
    code: "INVALID",
    error: "Choose another CSR",
  });
  assert.deepEqual(handoffAllowed({ actorId, targetId: "  ", targetActive: true, targetHasOpenCall: false }), {
    ok: false,
    code: "INVALID",
    error: "Choose another CSR",
  });
  assert.deepEqual(handoffAllowed({ actorId, targetId: "csr-2", targetActive: false, targetHasOpenCall: false }), {
    ok: false,
    code: "INVALID",
    error: "Choose an active CSR",
  });
  assert.deepEqual(handoffAllowed({ actorId, targetId: "csr-2", targetActive: true, targetHasOpenCall: true }), {
    ok: false,
    code: "CONFLICT",
    error: "That CSR already has an open call",
  });
});
