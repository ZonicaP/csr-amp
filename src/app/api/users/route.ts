import { NextResponse } from "next/server";
import { listUsers } from "@/lib/users/user-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";

export async function GET(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const page = Number(url.searchParams.get("page") ?? "1");
    const result = await listUsers(session.csrId, query, page);
    return NextResponse.json(result);
  } catch (error) {
    return csrErrorResponse(error);
  }
}
