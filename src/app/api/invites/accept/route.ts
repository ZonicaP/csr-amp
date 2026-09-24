import { NextResponse } from "next/server";
import { acceptInvite } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { setSessionCookie } from "@/lib/csr/session";
import { AccountVerificationEmail } from "@/lib/email/account-verification-email";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.token !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Invite token and password are required" }, { status: 400 });
    }
    const result = await acceptInvite(body.token, body.password);
    await setSessionCookie(result.csr.id);
    try {
      await createEmailService().send(
        result.csr.email,
        new AccountVerificationEmail(appUrl(), result.csr.name, result.verificationToken),
      );
    } catch (error) {
      if (error instanceof EmailDeliveryError) {
        return NextResponse.json({ csr: result.csr, emailSent: false, error: error.message }, { status: 201 });
      }
      throw error;
    }
    return NextResponse.json({ csr: result.csr, emailSent: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}
