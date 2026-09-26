import { NextResponse } from "next/server";
import { mapApiError } from "@/lib/http/api-error";

export function apiErrorResponse(error: unknown) {
  const mapped = mapApiError(error);
  if (mapped.log) console.error(error);
  return NextResponse.json({ error: mapped.message }, { status: mapped.status });
}

export function csrErrorResponse(error: unknown) {
  return apiErrorResponse(error);
}
