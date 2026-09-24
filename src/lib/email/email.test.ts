import assert from "node:assert/strict";
import test from "node:test";
import { AccountVerificationEmail } from "./account-verification-email.ts";
import { InviteEmail } from "./invite-email.ts";
import { PasswordResetEmail } from "./password-reset-email.ts";
import { NoticeEmail } from "./notice-email.ts";
import { PaymentRequestEmail } from "./payment-request-email.ts";

test("invite email links to signup", () => {
  const rendered = new InviteEmail("http://localhost:3000", "Zonica", "invite-token").render();
  assert.equal(rendered.subject, "You’re invited to the AMP CSR portal");
  assert.match(rendered.html, /cid:amp-logo/);
  assert.match(rendered.html, /Create account/);
  assert.match(rendered.html, /http:\/\/localhost:3000\/signup\?token=invite-token/);
  assert.match(rendered.text, /signup\?token=invite-token/);
});

test("verification email links to verify", () => {
  const rendered = new AccountVerificationEmail("http://localhost:3000", "Zonica", "verify-token").render();
  assert.match(rendered.html, /Verify email/);
  assert.match(rendered.html, /\/verify-email\?token=verify-token/);
});

test("payment email reads as an invoice", () => {
  const rendered = new PaymentRequestEmail(
    "http://localhost:3000",
    "Amelia",
    "Basic Wash on 2023 Honda CR-V",
    "$19.99",
    "Card expired",
    "AMP-10041",
  ).render();
  assert.match(rendered.subject, /Basic Wash on 2023 Honda CR-V/);
  assert.match(rendered.html, /Total/);
  assert.match(rendered.html, /\$19\.99/);
  assert.match(rendered.html, /Pay \$19\.99/);
  assert.match(rendered.html, /\/pay\/AMP-10041/);
  assert.match(rendered.text, /Total {2}\$19\.99/);
});

test("plate email lists the documents", () => {
  const rendered = new NoticeEmail(
    "http://localhost:3000",
    "Documents to update plate AMP1040",
    "Update a license plate",
    ["Hi Amelia, to change the plate on this membership we need:"],
    "This email is delivered to the signed-in CSR for this project.",
    ["A photo of the new plate", "The vehicle registration", "Proof the vehicle is yours"],
    ["Email those three documents to csr@example.com with the subject “Plate update AMP-10041”."],
    false,
  ).render();
  assert.match(rendered.html, /<li[^>]*>A photo of the new plate<\/li>/);
  assert.match(rendered.html, /csr@example.com/);
  assert.match(rendered.html, /Plate update AMP-10041/);
  assert.doesNotMatch(rendered.html, /Open the portal/);
  assert.match(rendered.text, /• A photo of the new plate/);
});

test("reset email links to reset", () => {
  const rendered = new PasswordResetEmail("http://localhost:3000", "Zonica", "reset-token").render();
  assert.match(rendered.html, /Reset password/);
  assert.match(rendered.html, /\/reset-password\?token=reset-token/);
  assert.match(rendered.text, /one hour/);
});
