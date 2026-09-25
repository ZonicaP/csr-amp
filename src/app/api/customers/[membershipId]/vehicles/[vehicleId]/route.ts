import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { updateVehiclePlate } from "@/lib/users/user-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ membershipId: string; vehicleId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId, vehicleId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.plate !== "string") return NextResponse.json({ error: "A plate is required" }, { status: 400 });
    await updateVehiclePlate(session.csrId, membershipId, vehicleId, body.plate);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}
