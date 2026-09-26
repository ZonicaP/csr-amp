import assert from "node:assert/strict";
import test from "node:test";
import { formatCallReference, randomCallReference } from "./reference.ts";

test("a call reference is short enough to read back", () => {
  assert.equal(formatCallReference(48291), "C-48291");
  assert.equal(formatCallReference(10000), "C-10000");
  assert.equal(formatCallReference(99999), "C-99999");
});

test("a random reference stays in the speakable range", () => {
  assert.equal(randomCallReference(() => 0), "C-10000");
  assert.equal(randomCallReference(() => 0.999999), "C-99999");
});
