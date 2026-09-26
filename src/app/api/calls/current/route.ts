import { NextResponse } from "next/server";
import { endCall, escalateCall, requestCallback } from "@/lib/calls/call-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";

export const POST = withApi(async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "end") {
      const call = await endCall(session.csrId, {
        gaveReference: body.gaveReference === true,
        confirmedNothingElse: body.confirmedNothingElse === true,
        notes: typeof body.notes === "string" ? body.notes : "",
        membershipId: typeof body.membershipId === "string" ? body.membershipId : undefined,
      });
      return NextResponse.json({ call });
    }
    if (body.action === "callback") {
      const call = await requestCallback(session.csrId, typeof body.note === "string" ? body.note : "", typeof body.membershipId === "string" ? body.membershipId : undefined);
      return NextResponse.json({ call });
    }
    if (body.action === "escalate") {
      const call = await escalateCall(
        session.csrId,
        typeof body.supervisorId === "string" ? body.supervisorId : "",
        typeof body.note === "string" ? body.note : "",
        typeof body.membershipId === "string" ? body.membershipId : undefined,
      );
      return NextResponse.json({ call });
    }
    return NextResponse.json({ error: "That action is not available" }, { status: 400 });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
