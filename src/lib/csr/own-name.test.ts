import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPermission } from "./permissions.ts";
import { parseOwnName, readCsrPatch } from "./own-name.ts";
import { parseAccountDetails } from "../users/account-details.ts";

const self = "csr-self";
const other = "csr-other";

describe("own CSR name", () => {
  it("trims a first name and surname and builds the display name", () => {
    assert.deepEqual(parseOwnName({ name: "  Zonica ", surname: " Pietersen  " }), {
      value: { name: "Zonica", surname: "Pietersen", displayName: "Zonica Pietersen" },
    });
  });

  it("rejects a blank first name or surname", () => {
    assert.deepEqual(parseOwnName({ name: "   ", surname: "Pietersen" }), { error: "Enter a first name" });
    assert.deepEqual(parseOwnName({ name: "Zonica", surname: " \n " }), { error: "Enter a surname" });
  });

  it("uses the same 80 character limit as customer names", () => {
    const atLimit = "a".repeat(80);
    const over = "a".repeat(81);
    const account = { firstName: "Amelia", lastName: "Keller", email: "amelia@example.com", phone: "(404) 555-0133" };
    assert.equal("value" in parseAccountDetails({ ...account, firstName: atLimit }), true);
    assert.equal("error" in parseAccountDetails({ ...account, firstName: over }), true);
    assert.equal("value" in parseOwnName({ name: atLimit, surname: "Lee" }), true);
    assert.deepEqual(parseOwnName({ name: over, surname: "Lee" }), { error: "Enter a first name" });
    assert.deepEqual(parseOwnName({ name: "Zonica", surname: over }), { error: "Enter a surname" });
  });

  it("lets a person save only their own name", () => {
    assert.deepEqual(readCsrPatch(self, self, { name: " Ada ", surname: " Lovelace " }), {
      kind: "own-name",
      name: "Ada",
      surname: "Lovelace",
    });
    assert.deepEqual(readCsrPatch(self, other, { name: "Ada", surname: "Lovelace" }), {
      kind: "forbidden",
      message: "You can change only your own name",
    });
  });

  it("refuses a role, email, or other field sent with a name", () => {
    for (const body of [
      { name: "Ada", surname: "Lovelace", roles: ["ADMIN"] },
      { name: "Ada", surname: "Lovelace", email: "ada@example.com" },
      { name: "Ada", surname: "Lovelace", status: "DISABLED" },
      { name: "Ada", surname: "Lovelace", displayName: "Someone Else" },
      { email: "ada@example.com" },
      { password: "new-password" },
    ]) {
      assert.equal(readCsrPatch(self, self, body).kind, "forbidden");
    }
  });

  it("leaves role changes on the existing access path and does not grant csr:manage", () => {
    assert.deepEqual(readCsrPatch(self, other, { roles: ["AGENT"] }), { kind: "access" });
    assert.equal(hasPermission(["AGENT"], "csr:manage"), false);
  });
});
