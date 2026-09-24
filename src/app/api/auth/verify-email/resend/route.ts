import { NextResponse } from "next/server";
import { resendVerification } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { AccountVerificationEmail } from "@/lib/email/account-verification-email";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";

export async function POST() {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const result = await resendVerification(session.csrId);
    try {
      await createEmailService().send(result.email, new AccountVerificationEmail(appUrl(), result.name, result.token));
    } catch (error) {
      if (error instanceof EmailDeliveryError) {
        return NextResponse.json({ error: error.message }, { status: 502 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}
