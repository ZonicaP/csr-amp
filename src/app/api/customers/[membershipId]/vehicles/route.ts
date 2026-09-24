import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { listMembershipVehicles } from "@/lib/users/subscription-actions";

export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId } = await params;
    const result = await listMembershipVehicles(session.csrId, membershipId);
    return NextResponse.json(result);
  } catch (error) {
    return csrErrorResponse(error);
  }
}
