import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapApiError } from "./api-error.ts";
import { clientRateKey, decideRateLimit } from "./rate-limit.ts";

describe("request rate limit", () => {
  it("blocks one client after the max and leaves another client alone", () => {
    const start = Date.UTC(2026, 0, 1);
    const first = decideRateLimit([], 2, 1000, start);
    const second = decideRateLimit(first.hits, 2, 1000, start + 10);
    const blocked = decideRateLimit(second.hits, 2, 1000, start + 20);
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfter > 0);
    assert.equal(decideRateLimit([], 2, 1000, start + 20).ok, true);
  });

  it("allows requests again after the window", () => {
    const start = Date.UTC(2026, 0, 1);
    const first = decideRateLimit([], 1, 1000, start);
    const next = decideRateLimit(first.hits, 1, 1000, start + 1000);
    assert.equal(first.ok, true);
    assert.equal(next.ok, true);
  });

  it("keys by ip, method, path, and actor", () => {
    const request = new Request("https://csr.example/api/users?q=ada", {
      method: "GET",
      headers: { "x-forwarded-for": "1.1.1.1", "x-real-ip": "203.0.113.8" },
    });
    assert.equal(clientRateKey(request), "203.0.113.8:GET:/api/users:anon");
    assert.equal(clientRateKey(request, "csr_1"), "203.0.113.8:GET:/api/users:csr_1");
  });
});

describe("api error mapping", () => {
  it("keeps a known CSR error message and status", () => {
    const error = Object.assign(new Error("That customer could not be found"), { brand: "csr", code: "NOT_FOUND" });
    const mapped = mapApiError(error);
    assert.equal(mapped.status, 404);
    assert.equal(mapped.message, "That customer could not be found");
    assert.equal(mapped.log, false);
  });

  it("hides prisma, sql, and connection details", () => {
    const error = new Error("Invalid `prisma.user.findMany()` invocation:\npostgresql://app:secret@db.internal:5432/csr");
    const mapped = mapApiError(error);
    assert.equal(mapped.status, 500);
    assert.equal(mapped.message, "Something went wrong. Try again.");
    assert.equal(mapped.message.includes("prisma"), false);
    assert.equal(mapped.message.includes("postgresql"), false);
    assert.equal(mapped.log, true);
  });

  it("replaces mail and debug failures with a fixed message", () => {
    const mail = Object.assign(new Error("The email could not be sent. Invalid login: SMTP_PASSWORD"), { brand: "email-delivery" });
    const debug = Object.assign(new Error("Add GROQ_API_KEY to run Smart debug."), { brand: "debug-unavailable" });
    assert.equal(mapApiError(mail).message, "The email could not be sent.");
    assert.equal(mapApiError(mail).status, 502);
    assert.equal(mapApiError(debug).message, "Smart debug is unavailable. Try again.");
    assert.equal(mapApiError(debug).message.includes("GROQ"), false);
  });
});
