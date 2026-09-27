import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accountDetailChanges, parseAccountDetails, parseEmail, parsePhone } from "./account-details.ts";

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

  it("rejects blank, spaced, and incomplete emails", () => {
    assert.deepEqual(parseEmail("  Amelia@Example.com "), { value: "amelia@example.com" });
    for (const email of ["", "   ", "amelia example.com", "amelia@", "@example.com", "amelia@example", "ame lia@example.com"]) {
      assert.deepEqual(parseEmail(email), { error: "Enter a valid email" });
    }
  });

  it("rejects a phone that is too short, too long, or not a number", () => {
    assert.deepEqual(parsePhone("  "), { value: null });
    assert.deepEqual(parsePhone("555-0101"), { value: "555-0101" });
    assert.deepEqual(parsePhone("123456789012345"), { value: "123456789012345" });
    for (const phone of ["555", "call me", "1234567890123456"]) {
      assert.deepEqual(parsePhone(phone), { error: "Enter a phone number with 7 to 15 digits" });
    }
  });

  it("describes only the fields that changed", () => {
    assert.deepEqual(accountDetailChanges(current, { ...current, email: "amelia@example.com" }), []);
    assert.deepEqual(accountDetailChanges(current, { ...current, lastName: "Brooks", phone: null }), [
      "Name changed from Amelia Keller to Amelia Brooks.",
      "Phone changed from 555-010-41 to none.",
    ]);
  });
});
