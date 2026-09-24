import { NextResponse } from "next/server";
import { CsrRoleName } from "@prisma/client";
import { deleteUnactivatedInvite, inviteCsr, listCsrs } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { readSession } from "@/lib/csr/session";
import { InviteEmail } from "@/lib/email/invite-email";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";
import { appUrl, createEmailService } from "@/lib/email/email-service";

const roleNames = new Set<string>(Object.values(CsrRoleName));

function isRoleList(value: unknown): value is CsrRoleName[] {
  return Array.isArray(value) && value.every((role) => typeof role === "string" && roleNames.has(role));
}

export async function GET() {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const csrs = await listCsrs(session.csrId);
    return NextResponse.json({ csrs });
  } catch (error) {
    return csrErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    if (
      typeof body.name !== "string" ||
      typeof body.surname !== "string" ||
      typeof body.email !== "string" ||
      typeof body.displayName !== "string" ||
      !isRoleList(body.roles)
    ) {
      return NextResponse.json({ error: "Name, surname, email, display name, and roles are required" }, { status: 400 });
    }
    const result = await inviteCsr(session.csrId, {
      name: body.name,
      surname: body.surname,
      email: body.email.toLowerCase(),
      displayName: body.displayName,
      roles: body.roles,
    });
    try {
      await createEmailService().send(
        result.csr.email,
        new InviteEmail(appUrl(), result.csr.name, result.inviteToken),
      );
    } catch (error) {
      await deleteUnactivatedInvite(result.csr.id);
      if (error instanceof EmailDeliveryError) {
        return NextResponse.json({ error: error.message }, { status: 502 });
      }
      throw error;
    }
    return NextResponse.json({ csr: result.csr }, { status: 201 });
  } catch (error) {
    return csrErrorResponse(error);
  }
}
