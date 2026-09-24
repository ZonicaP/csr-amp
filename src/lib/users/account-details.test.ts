import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accountDetailChanges, parseAccountDetails } from "./account-details.ts";

const current = { firstName: "Amelia", lastName: "Keller", email: "amelia@example.com", phone: "555-010-41" };

describe("account details", () => {
  it("accepts a name, email, and phone", () => {
    const parsed = parseAccountDetails({ firstName: " Amelia ", lastName: "Keller", email: "Amelia@Example.com", phone: " 555-010-41 " });
    assert.deepEqual(parsed, { value: { firstName: "Amelia", lastName: "Keller", email: "amelia@example.com", phone: "555-010-41" } });
  });

  it("clears a blank phone", () => {
    const parsed = parseAccountDetails({ firstName: "Amelia", lastName: "Keller", email: "amelia@example.com", phone: "  " });
    assert.ok("value" in parsed);
    if ("value" in parsed) assert.equal(parsed.value.phone, null);
  });

  it("rejects a short phone and a broken email", () => {
    assert.deepEqual(parseAccountDetails({ ...current, phone: "555" }), { error: "Enter a phone number with 7 to 15 digits" });
    assert.deepEqual(parseAccountDetails({ ...current, email: "amelia" }), { error: "Enter a valid email" });
  });

  it("describes only the fields that changed", () => {
    assert.deepEqual(accountDetailChanges(current, { ...current, email: "amelia@example.com" }), []);
    assert.deepEqual(accountDetailChanges(current, { ...current, lastName: "Brooks", phone: null }), [
      "Name changed from Amelia Keller to Amelia Brooks.",
      "Phone changed from 555-010-41 to none.",
    ]);
  });
});
