import { NextResponse } from "next/server";
import { clearPasswordReset, requestPasswordReset, resetPassword } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { PasswordResetEmail } from "@/lib/email/password-reset-email";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";
import { appUrl, createEmailService } from "@/lib/email/email-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const email = body.email.toLowerCase();
    const result = await requestPasswordReset(email);
    if (result.token && result.name) {
      try {
        await createEmailService().send(email, new PasswordResetEmail(appUrl(), result.name, result.token));
      } catch (error) {
        await clearPasswordReset(email);
        if (error instanceof EmailDeliveryError) {
          return NextResponse.json({ error: error.message }, { status: 502 });
        }
        throw error;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}

export async function PUT(request: Request) {
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
}
