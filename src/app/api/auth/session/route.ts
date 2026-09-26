import { NextResponse } from "next/server";
import { currentCsr, loginCsr } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { authBlocked, clearAuthAttempts, recordAuthFailure } from "@/lib/csr/auth-limit";
import { withApi } from "@/lib/http/with-api";
import { clearSessionCookie, readSession, setSessionCookie } from "@/lib/csr/session";

export const GET = withApi(async function GET() {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const csr = await currentCsr(session.csrId);
    return NextResponse.json({ csr });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });

export const POST = withApi(async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const email = body.email.toLowerCase();
    const limited = await authBlocked(`login:${email}`, 8);
    if (!limited.ok) {
      const minutes = Math.max(1, Math.ceil(limited.retryAfter / 60));
      return NextResponse.json({ error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` }, { status: 429 });
    }
    try {
      const csr = await loginCsr(email, body.password);
      await clearAuthAttempts(`login:${email}`);
      await setSessionCookie(csr.id);
      return NextResponse.json({ csr });
    } catch (error) {
      await recordAuthFailure(`login:${email}`);
      throw error;
    }
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "public", limit: "auth" });

export const DELETE = withApi(async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}, { auth: "public", limit: "standard" });
