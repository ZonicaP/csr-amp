import { NextResponse } from "next/server";
import { requestPasswordReset, resetPassword } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const result = await requestPasswordReset(body.email.toLowerCase());
    const payload: { ok: true; resetToken?: string } = { ok: true };
    if (process.env.NODE_ENV !== "production" && result.token) {
      payload.resetToken = result.token;
    }
    return NextResponse.json(payload);
  } catch (error) {
    return csrErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.token !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Reset token and password are required" }, { status: 400 });
    }
    await resetPassword(body.token, body.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}
