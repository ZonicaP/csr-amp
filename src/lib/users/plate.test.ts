import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { georgiaPlate, parsePlate } from "./plate.ts";

describe("georgia plates", () => {
  it("uses three letters and four digits", () => {
    const plates = Array.from({ length: 48 }, (_, index) => georgiaPlate(index));
    assert.equal(new Set(plates).size, 48);
    for (const plate of plates) assert.match(plate, /^[A-Z]{3}\d{4}$/);
  });

  it("accepts a Georgia plate and rejects anything longer", () => {
    assert.deepEqual(parsePlate(" rxt-4821 "), { value: "RXT4821" });
    assert.deepEqual(parsePlate("TOOLONG1"), { error: "Enter a plate with 1 to 7 letters or numbers" });
    assert.deepEqual(parsePlate(""), { error: "Enter a plate with 1 to 7 letters or numbers" });
  });
});
