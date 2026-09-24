import { NextResponse } from "next/server";
import { currentCsr, loginCsr } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { authBlocked, clearAuthAttempts, recordAuthFailure } from "@/lib/csr/auth-limit";
import { clearSessionCookie, readSession, setSessionCookie } from "@/lib/csr/session";

export async function GET() {
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
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const email = body.email.toLowerCase();
    const limited = authBlocked(`login:${email}`, 8);
    if (!limited.ok) {
      const minutes = Math.max(1, Math.ceil(limited.retryAfter / 60));
      return NextResponse.json({ error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` }, { status: 429 });
    }
    try {
      const csr = await loginCsr(email, body.password);
      clearAuthAttempts(`login:${email}`);
      await setSessionCookie(csr.id);
      return NextResponse.json({ csr });
    } catch (error) {
      recordAuthFailure(`login:${email}`);
      throw error;
    }
  } catch (error) {
    return csrErrorResponse(error);
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
