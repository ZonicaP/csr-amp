import { NextResponse } from "next/server";
import { acceptInvite } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { setSessionCookie } from "@/lib/csr/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.token !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Invite token and password are required" }, { status: 400 });
    }
    const csr = await acceptInvite(body.token, body.password);
    await setSessionCookie(csr.id);
    return NextResponse.json({ csr });
  } catch (error) {
    return csrErrorResponse(error);
  }
}
