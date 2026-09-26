import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";
import { updateCustomerDetails } from "@/lib/users/user-service";

export const PATCH = withApi(async function PATCH(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    const { membershipId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.firstName !== "string" || typeof body.lastName !== "string" || typeof body.email !== "string" || typeof body.phone !== "string") {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }
    await updateCustomerDetails(session.csrId, membershipId, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
