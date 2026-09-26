import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";
import { accountSnapshot } from "@/lib/debug/account-issue";
import { csrQuestionAllowed, takeDebugTurn } from "@/lib/debug/debug-policy";
import { debugAccount } from "@/lib/debug/groq-debug";
import { getCustomer } from "@/lib/users/user-service";

export const POST = withApi(async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const { membershipId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question || question.length > 400) {
      return NextResponse.json({ error: "Describe the issue in a few sentences." }, { status: 400 });
    }
    const turn = takeDebugTurn(session.csrId);
    if (!turn.ok) {
      const minutes = Math.max(1, Math.ceil(turn.retryAfter / 60));
      return NextResponse.json(
        { error: `Smart debug is limited to 8 questions every 10 minutes. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
        { status: 429, headers: { "Retry-After": String(turn.retryAfter) } },
      );
    }
    if (!csrQuestionAllowed(question)) {
      return NextResponse.json({ error: "Smart debug only answers questions about this membership." }, { status: 400 });
    }
    const customer = await getCustomer(session.csrId, membershipId);
    if (!customer) {
      return NextResponse.json({ error: "That customer could not be found" }, { status: 404 });
    }
    const answer = await debugAccount(accountSnapshot(customer), question);
    return NextResponse.json(answer);
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
