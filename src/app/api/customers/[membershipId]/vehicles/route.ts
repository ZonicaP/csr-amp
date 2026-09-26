import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";
import { listMembershipVehicles } from "@/lib/users/subscription-actions";
import { createVehicle } from "@/lib/users/user-service";

export const GET = withApi(async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId } = await params;
    const result = await listMembershipVehicles(session.csrId, membershipId);
    return NextResponse.json(result);
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });

export const POST = withApi(async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    await createVehicle(session.csrId, membershipId, {
      year: typeof body.year === "string" ? body.year : "",
      make: typeof body.make === "string" ? body.make : "",
      model: typeof body.model === "string" ? body.model : "",
      plate: typeof body.plate === "string" ? body.plate : "",
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
