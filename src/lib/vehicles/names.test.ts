import assert from "node:assert/strict";
import test from "node:test";
import { displayVehicleName, matchVehicleNames } from "./names.ts";

test("vehicle names keep short brands uppercase", () => {
  assert.equal(displayVehicleName("HONDA"), "Honda");
  assert.equal(displayVehicleName("BMW"), "BMW");
  assert.equal(displayVehicleName("MERCEDES-BENZ"), "Mercedes-Benz");
});

test("matches that start with the query come first", () => {
  assert.deepEqual(matchVehicleNames(["Honda", "Holden", "Hyundai", "Toyota"], "ho"), ["Honda", "Holden"]);
  assert.deepEqual(matchVehicleNames(["CR-V", "Civic", "Accord"], "c"), ["CR-V", "Civic"]);
  assert.deepEqual(matchVehicleNames(["Mercedes-Benz", "Bentley"], "benz"), ["Mercedes-Benz"]);
});

test("make search skips companies that only contain the letters", () => {
  assert.deepEqual(
    matchVehicleNames(
      ["Affordable Aluminum", "Ford", "Ford Motor Company of New Zealand", "Fords Trailer Sales", "Stanford Customs"],
      "ford",
    ),
    ["Ford", "Fords Trailer Sales", "Ford Motor Company of New Zealand"],
  );
});
