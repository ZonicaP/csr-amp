import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { csrMatchesQuery } from "./team-search.ts";

const zonica = { name: "Zonica", surname: "Pietersen", email: "pietersen.zonica@gmail.com" };

describe("CSR team search", () => {
  it("matches a name, surname, or email", () => {
    assert.equal(csrMatchesQuery(zonica, "zonica"), true);
    assert.equal(csrMatchesQuery(zonica, "Pietersen"), true);
    assert.equal(csrMatchesQuery(zonica, "gmail.com"), true);
  });

  it("matches a name and surname together in either order", () => {
    assert.equal(csrMatchesQuery(zonica, "zonica pietersen"), true);
    assert.equal(csrMatchesQuery(zonica, "pietersen zonica"), true);
  });

  it("rejects a token that is not in the name or email", () => {
    assert.equal(csrMatchesQuery(zonica, "amelia"), false);
    assert.equal(csrMatchesQuery(zonica, ""), true);
  });
});
