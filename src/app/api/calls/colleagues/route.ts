import { NextResponse } from "next/server";
import { listHandoffCsrs } from "@/lib/calls/call-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { withApi } from "@/lib/http/with-api";

export const GET = withApi(async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const colleagues = await listHandoffCsrs(session.csrId);
    return NextResponse.json({ colleagues });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
