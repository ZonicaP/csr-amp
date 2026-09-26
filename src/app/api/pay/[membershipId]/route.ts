import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { settleOverdueMembership } from "@/lib/users/user-service";

export const POST = withApi(async function POST(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const { membershipId } = await params;
    const result = await settleOverdueMembership(membershipId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}, { auth: "public", limit: "standard" });
