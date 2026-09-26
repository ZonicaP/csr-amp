import assert from "node:assert/strict";
import test from "node:test";
import { callListWhere, callSearchWhere } from "./call-search.ts";

test("an empty call search does not filter", () => {
  assert.deepEqual(callSearchWhere("  "), {});
});

test("each word has to match the reference, the agent, or the customer", () => {
  const where = callSearchWhere("C-48291 Brooks");
  assert.equal(Array.isArray(where.AND), true);
  assert.equal((where.AND as unknown[]).length, 2);
});

test("the callbacks filter is off by default", () => {
  assert.deepEqual(callListWhere("  ", false), {});
});

test("callbacks only returns every CALLBACK call when the text search is empty", () => {
  assert.deepEqual(callListWhere("  ", true), { status: "CALLBACK" });
});

test("callbacks only keeps the text search", () => {
  const where = callListWhere("Brooks", true);
  assert.equal(Array.isArray(where.AND), true);
  assert.equal((where.AND as unknown[]).length, 2);
  const status = (where.AND as { status?: string }[])[1];
  assert.equal(status?.status, "CALLBACK");
});
