import { NextResponse } from "next/server";
import { clearPasswordReset, requestPasswordReset, resetPassword } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { PasswordResetEmail } from "@/lib/email/password-reset-email";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";
import { authBlocked, recordAuthFailure } from "@/lib/csr/auth-limit";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { withApi } from "@/lib/http/with-api";

export const POST = withApi(async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const email = body.email.toLowerCase();
    const limited = authBlocked(`reset:${email}`, 5);
    if (!limited.ok) {
      const minutes = Math.max(1, Math.ceil(limited.retryAfter / 60));
      return NextResponse.json({ error: `Too many reset emails. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` }, { status: 429 });
    }
    recordAuthFailure(`reset:${email}`);
    const result = await requestPasswordReset(email);
    if (result.token && result.name) {
      try {
        await createEmailService().send(email, new PasswordResetEmail(appUrl(), result.name, result.token));
      } catch (error) {
        await clearPasswordReset(email);
        if (error instanceof EmailDeliveryError) return csrErrorResponse(error);
        throw error;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "public", limit: "auth" });

export const PUT = withApi(async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.token !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Reset token and password are required" }, { status: 400 });
    }
    await resetPassword(body.token, body.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "public", limit: "auth" });
