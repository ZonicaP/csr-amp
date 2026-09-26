import assert from "node:assert/strict";
import test from "node:test";
import { customerNoticeFootnote, customerNoticeTo } from "./customer-recipient.ts";

test("a real membership address receives the email", () => {
  assert.deepEqual(customerNoticeTo("ava.patel@ampmemberships.com", "csr@amp.test"), {
    to: "ava.patel@ampmemberships.com",
    sample: false,
  });
  assert.equal(customerNoticeFootnote(false), "This email was sent to the member.");
});

test("a sample address is delivered to the signed-in CSR", () => {
  assert.deepEqual(customerNoticeTo("  Ava.Patel@Example.com ", "csr@amp.test"), {
    to: "csr@amp.test",
    sample: true,
  });
  assert.match(customerNoticeFootnote(true), /sample address/);
});
