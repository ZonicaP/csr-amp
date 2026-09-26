import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";

export const POST = withApi(async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.token !== "string") {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }
    await verifyEmail(body.token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "public", limit: "auth" });
