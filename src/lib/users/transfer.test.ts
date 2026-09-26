import assert from "node:assert/strict";
import test from "node:test";
import { transferPlan } from "./transfer.ts";

const plan = {
  status: "ACTIVE" as const,
  planName: "The Works",
  vehicleId: "car-1",
  vehicleLabel: "2022 Tesla Model 3 (KBA9205)",
  membershipId: "AMP-10033",
};

test("a plan moves to another vehicle", () => {
  assert.deepEqual(
    transferPlan({
      plan,
      destinationVehicleId: "car-2",
      destination: { vehicleLabel: "2024 Subaru Outback (PFA2357)", membershipId: "AMP-10033", status: "ACTIVE", hasSamePlan: false },
    }),
    { ok: true, summary: "The Works moved from 2022 Tesla Model 3 (KBA9205) on AMP-10033 to 2024 Subaru Outback (PFA2357) on AMP-10033." },
  );
});

test("a transfer stays on an active plan and a different vehicle", () => {
  assert.deepEqual(transferPlan({ plan: null, destinationVehicleId: "car-2", destination: null }), { ok: false, code: "NOT_FOUND", error: "That plan could not be found" });
  assert.deepEqual(transferPlan({ plan: { ...plan, status: "CANCELLED" }, destinationVehicleId: "car-2", destination: null }), { ok: false, code: "CONFLICT", error: "That plan is not active" });
  assert.deepEqual(transferPlan({ plan, destinationVehicleId: "car-1", destination: null }), { ok: false, code: "INVALID", error: "Choose a different vehicle" });
  assert.deepEqual(transferPlan({ plan, destinationVehicleId: "car-2", destination: null }), { ok: false, code: "NOT_FOUND", error: "That vehicle could not be found" });
  assert.deepEqual(
    transferPlan({
      plan,
      destinationVehicleId: "car-2",
      destination: { vehicleLabel: "Other", membershipId: "AMP-10002", status: "CANCELLED", hasSamePlan: false },
    }),
    { ok: false, code: "CONFLICT", error: "That membership is cancelled" },
  );
  assert.deepEqual(
    transferPlan({
      plan,
      destinationVehicleId: "car-2",
      destination: { vehicleLabel: "Other", membershipId: "AMP-10002", status: "OVERDUE", hasSamePlan: true },
    }),
    { ok: false, code: "CONFLICT", error: "That vehicle already has this plan" },
  );
});
