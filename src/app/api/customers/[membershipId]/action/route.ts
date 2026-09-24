import { NextResponse } from "next/server";
import { CsrError } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";
import type { SuggestedAction } from "@/lib/debug/account-issue";
import { runAccountAction } from "@/lib/users/account-actions";

function actionFrom(body: Record<string, unknown>): SuggestedAction | null {
  if (body.type === "reactivate-membership" || body.type === "cancel-membership" || body.type === "offer-discount") return { type: body.type };
  if ((body.type === "email-payment-link" || body.type === "refund-charge") && typeof body.purchaseId === "string") {
    return { type: body.type, purchaseId: body.purchaseId };
  }
  if (body.type === "email-plate-documents" && typeof body.vehicleId === "string") return { type: body.type, vehicleId: body.vehicleId };
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId } = await params;
    const action = actionFrom((await request.json()) as Record<string, unknown>);
    if (!action || action.type === "email-payment-link") return NextResponse.json({ error: "That action is not available" }, { status: 400 });
    await runAccountAction(session.csrId, membershipId, action);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EmailDeliveryError) return NextResponse.json({ error: error.message }, { status: 502 });
    if (error instanceof CsrError) return csrErrorResponse(error);
    return NextResponse.json({ error: "That action could not be completed" }, { status: 502 });
  }
}
