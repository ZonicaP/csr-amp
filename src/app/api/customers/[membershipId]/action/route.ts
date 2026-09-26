import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";
import type { SuggestedAction } from "@/lib/debug/account-issue";
import { runAccountAction } from "@/lib/users/account-actions";
import { cancellationReason } from "@/lib/users/cancellation";

function actionFrom(body: Record<string, unknown>): SuggestedAction | null {
  if (body.type === "reactivate-membership" || body.type === "cancel-membership" || body.type === "offer-discount" || body.type === "email-plate-documents") return { type: body.type };
  if ((body.type === "email-payment-link" || body.type === "refund-charge") && typeof body.purchaseId === "string") {
    return { type: body.type, purchaseId: body.purchaseId };
  }
  return null;
}

export const POST = withApi(async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = actionFrom(body);
    const reason = typeof body.reason === "string" ? body.reason : "";
    if (!action || action.type === "email-payment-link") return NextResponse.json({ error: "That action is not available" }, { status: 400 });
    if (action.type === "cancel-membership") {
      const parsed = cancellationReason(reason);
      if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    await runAccountAction(session.csrId, membershipId, action, { reason, percent: body.percent, period: body.period });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
