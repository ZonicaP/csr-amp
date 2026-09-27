import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discountPhrase, maxDiscountPercent, parseOfferDiscount, storedDiscount } from "./discount.ts";

describe("discount offers", () => {
  it("caps an agent at 10 percent", () => {
    assert.equal(maxDiscountPercent(["AGENT"]), 10);
    assert.equal(maxDiscountPercent(["ADMIN"]), null);
    assert.deepEqual(parseOfferDiscount(10, "3-months", ["AGENT"]), { percent: 10, period: "3-months", label: "3 months" });
    assert.deepEqual(parseOfferDiscount(11, "1-year", ["AGENT"]), { error: "This role can offer up to 10%" });
  });

  it("lets an admin offer more than 10 percent", () => {
    assert.deepEqual(parseOfferDiscount(25, "1-year", ["ADMIN"]), { percent: 25, period: "1-year", label: "1 year" });
    assert.deepEqual(parseOfferDiscount(0, "3-months", ["ADMIN"]), { error: "Enter a discount from 1 to 100" });
    assert.deepEqual(parseOfferDiscount(15, "forever", ["ADMIN"]), { error: "Choose how long the discount lasts" });
  });

  it("reads the one current discount in the offer wording", () => {
    assert.equal(discountPhrase(10, "3 months"), "10% off for 3 months");
    assert.deepEqual(storedDiscount(10, "3-months"), { percent: 10, period: "3-months", label: "3 months" });
    assert.equal(storedDiscount(null, null), null);
    assert.equal(storedDiscount(10, null), null);
    assert.equal(storedDiscount(10, "forever"), null);
  });
});
