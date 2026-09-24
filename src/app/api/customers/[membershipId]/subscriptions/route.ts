import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";
import { runSubscriptionChange, type SubscriptionChange } from "@/lib/users/subscription-actions";

function changeFrom(body: Record<string, unknown>): SubscriptionChange | null {
  if (body.type === "add" && typeof body.vehicleId === "string" && typeof body.planName === "string") {
    return { type: "add", vehicleId: body.vehicleId, planName: body.planName };
  }
  if (body.type === "remove" && typeof body.subscriptionId === "string") {
    return { type: "remove", subscriptionId: body.subscriptionId };
  }
  if (body.type === "transfer" && typeof body.subscriptionId === "string" && typeof body.destinationVehicleId === "string") {
    return { type: "transfer", subscriptionId: body.subscriptionId, destinationVehicleId: body.destinationVehicleId };
  }
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const change = changeFrom(body);
    if (!change) return NextResponse.json({ error: "That subscription change is not available" }, { status: 400 });
    await runSubscriptionChange(session.csrId, membershipId, change);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EmailDeliveryError) return NextResponse.json({ error: error.message }, { status: 502 });
    return csrErrorResponse(error);
  }
}
