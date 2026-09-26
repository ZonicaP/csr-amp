import { NextResponse } from "next/server";
import { listEscalationAdmins } from "@/lib/calls/call-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";

export const GET = withApi(async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const admins = await listEscalationAdmins(session.csrId);
    return NextResponse.json({ admins });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
