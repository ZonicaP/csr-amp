import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { PaymentRequestEmail } from "@/lib/email/payment-request-email";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";
import { paymentRequest } from "@/lib/users/user-service";

export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const { membershipId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.purchaseId !== "string") {
      return NextResponse.json({ error: "A payment is required" }, { status: 400 });
    }
    const invoice = await paymentRequest(session.csrId, membershipId, body.purchaseId);
    try {
      await createEmailService().send(
        invoice.to,
        new PaymentRequestEmail(appUrl(), invoice.name, invoice.description, invoice.amount, invoice.reason, invoice.membershipId),
      );
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
