import { NextResponse } from "next/server";
import { CsrRoleName, CsrStatus } from "@prisma/client";
import { cancelInvite, resendInvite, saveInviteToken, updateCsrAccess } from "@/lib/csr/csr-service";
import { csrErrorResponse } from "@/lib/csr/http";
import { InviteEmail } from "@/lib/email/invite-email";
import { EmailDeliveryError } from "@/lib/email/smtp-transport";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { withApi } from "@/lib/http/with-api";
import { readSession } from "@/lib/csr/session";

const roleNames = new Set<string>(Object.values(CsrRoleName));
const statuses = new Set<string>(Object.values(CsrStatus));

export const PATCH = withApi(async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
}, { auth: "required", limit: "standard" });

export const POST = withApi(async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const { id } = await context.params;
    const invite = await resendInvite(session.csrId, id);
    try {
      await createEmailService().send(invite.email, new InviteEmail(appUrl(), invite.name, invite.token));
    } catch (error) {
      if (error instanceof EmailDeliveryError) return csrErrorResponse(error);
      throw error;
    }
    await saveInviteToken(invite.id, invite.token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "auth" });

export const DELETE = withApi(async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await readSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in as an active CSR" }, { status: 401 });
    }
    const { id } = await context.params;
    await cancelInvite(session.csrId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
