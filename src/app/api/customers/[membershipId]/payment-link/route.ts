import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";
import { sendPaymentLink } from "@/lib/users/user-service";

export const POST = withApi(async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
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
    await sendPaymentLink(session.csrId, membershipId, body.purchaseId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
