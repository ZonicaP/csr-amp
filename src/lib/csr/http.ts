import { NextResponse } from "next/server";
import { CsrError } from "@/lib/csr/csr-service";

const statusByCode = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  INVALID: 400,
  UNAUTHENTICATED: 401,
} as const;

export function csrErrorResponse(error: unknown) {
  if (error instanceof CsrError) {
    return NextResponse.json({ error: error.message }, { status: statusByCode[error.code] });
  }
  throw error;
}
