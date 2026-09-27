import assert from "node:assert/strict";
import test from "node:test";
import { destinationAfterCallEnds, routeAfterCallAction } from "./after-end.ts";

test("ending on a customer page returns to the customers list", () => {
  assert.equal(destinationAfterCallEnds("/customers/AMP-10001"), "/customers");
  assert.equal(destinationAfterCallEnds("/customers/AMP-10001/vehicles"), "/customers");
  assert.equal(destinationAfterCallEnds("/customers/AMP-10001/payments"), "/customers");
  assert.equal(destinationAfterCallEnds("/customers/AMP-10001/logs"), "/customers");
  assert.equal(destinationAfterCallEnds("/customers/AMP-10001/logs/detail"), "/customers");
});

test("ending on the calls list stays there", () => {
  assert.equal(destinationAfterCallEnds("/calls"), null);
  assert.equal(destinationAfterCallEnds("/calls/"), null);
  assert.equal(destinationAfterCallEnds("/calls/C-10001"), null);
});

test("ending from any other portal page goes to calls", () => {
  assert.equal(destinationAfterCallEnds("/customers"), "/calls");
  assert.equal(destinationAfterCallEnds("/team"), "/calls");
  assert.equal(destinationAfterCallEnds("/profile"), "/calls");
  assert.equal(destinationAfterCallEnds("/"), "/calls");
});

test("navigation follows a status that is no longer open", () => {
  assert.equal(routeAfterCallAction("/customers/AMP-10001", "CLOSED"), "/customers");
  assert.equal(routeAfterCallAction("/team", "CALLBACK"), "/calls");
  assert.equal(routeAfterCallAction("/calls", "CLOSED"), null);
  assert.equal(routeAfterCallAction("/customers/AMP-10001", "OPEN"), null);
  assert.equal(routeAfterCallAction("/customers/AMP-10001", undefined), null);
});
