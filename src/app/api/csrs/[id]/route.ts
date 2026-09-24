import { NextResponse } from "next/server";
import { CsrRoleName, CsrStatus } from "@prisma/client";
import { updateCsrAccess } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";

const roleNames = new Set<string>(Object.values(CsrRoleName));
const statuses = new Set<string>(Object.values(CsrStatus));

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = body.status;
    const roles = body.roles;
    if (status !== undefined && (typeof status !== "string" || !statuses.has(status))) {
      return NextResponse.json({ error: "Status is invalid" }, { status: 400 });
    }
    if (
      roles !== undefined &&
      (!Array.isArray(roles) || roles.some((role) => typeof role !== "string" || !roleNames.has(role)))
    ) {
      return NextResponse.json({ error: "Roles are invalid" }, { status: 400 });
    }
    const csr = await updateCsrAccess(session.csrId, id, {
      status: status as CsrStatus | undefined,
      roles: roles as CsrRoleName[] | undefined,
    });
    return NextResponse.json({ csr });
  } catch (error) {
    return csrErrorResponse(error);
  }
}
