import { NextResponse } from "next/server";
import { withApi } from "@/lib/http/with-api";

export const GET = withApi(function GET() {
  return NextResponse.json({ status: "ok" });
}, { auth: "public", limit: "none" });
