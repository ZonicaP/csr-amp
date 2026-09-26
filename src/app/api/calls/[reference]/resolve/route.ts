import { NextResponse } from "next/server";
import { resolveCallback } from "@/lib/calls/call-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";

export const POST = withApi(async function POST(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { reference } = await params;
    const call = await resolveCallback(session.csrId, reference);
    return NextResponse.json({ call });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
