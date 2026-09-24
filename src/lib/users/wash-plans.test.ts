import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isWashPlan, plansAvailableToAdd } from "./wash-plans.ts";

describe("wash plans", () => {
  it("accepts the three membership plans", () => {
    assert.equal(isWashPlan("Basic Wash"), true);
    assert.equal(isWashPlan("Gold"), false);
  });

  it("offers plans that are not already active on the vehicle", () => {
    assert.deepEqual(plansAvailableToAdd(["Basic Wash", "Basic Wash"]), ["Unlimited Wash", "The Works"]);
    assert.deepEqual(plansAvailableToAdd(["Unlimited Wash", "Basic Wash", "The Works"]), []);
  });
});
