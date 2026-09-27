import assert from "node:assert/strict";
import test from "node:test";
import { routeAfterCallAction } from "./after-end.ts";

test("a finished call opens its own page", () => {
  assert.equal(routeAfterCallAction("CLOSED", "C-10001"), "/calls/C-10001");
  assert.equal(routeAfterCallAction("CALLBACK", "c-10001"), "/calls/C-10001");
  assert.equal(routeAfterCallAction("CLOSED", " C-74779 "), "/calls/C-74779");
});

test("an open call and a failed action stay on the current page", () => {
  assert.equal(routeAfterCallAction("OPEN", "C-10001"), null);
  assert.equal(routeAfterCallAction(undefined, "C-10001"), null);
});

test("a finished call without a usable reference goes to the calls list", () => {
  assert.equal(routeAfterCallAction("CLOSED", ""), "/calls");
  assert.equal(routeAfterCallAction("CALLBACK", "not-a-call"), "/calls");
});
