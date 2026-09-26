import { NextResponse } from "next/server";
import { searchCalls, startCall } from "@/lib/calls/call-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";

export const GET = withApi(async function GET(request: Request) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const query = params.get("q") ?? "";
    const callbacksOnly = params.get("status") === "CALLBACK";
    const calls = await searchCalls(session.csrId, query, { callbacksOnly });
    return NextResponse.json({ calls });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });

export const POST = withApi(async function POST() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const call = await startCall(session.csrId);
    return NextResponse.json({ call }, { status: 201 });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
