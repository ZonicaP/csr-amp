import { CsrRoleName, CsrStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createInviteToken, hashInviteToken, hashPassword, verifyPassword } from "@/lib/csr/password";
import { hasPermission, type Permission } from "@/lib/csr/permissions";

const roleSelect = { select: { role: true } } as const;

const csrIdentitySelect = {
  id: true,
  name: true,
  surname: true,
  email: true,
  displayName: true,
  status: true,
  emailVerifiedAt: true,
  roles: roleSelect,
} as const;

type CsrIdentity = {
  id: string;
  name: string;
  surname: string;
  email: string;
  displayName: string;
  status: CsrStatus;
  emailVerifiedAt: Date | null;
  roles: { role: CsrRoleName }[];
};

export type CsrWithRoles = CsrIdentity;

export class CsrError extends Error {
  readonly brand = "csr" as const;

  constructor(
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID" | "UNAUTHENTICATED",
    message: string,
  ) {
    super(message);
  }
}

function roleNames(csr: { roles: { role: CsrRoleName }[] }): CsrRoleName[] {
  return csr.roles.map((entry) => entry.role);
}

export function toPublicCsr(csr: CsrWithRoles) {
  return {
    id: csr.id,
    name: csr.name,
    surname: csr.surname,
    email: csr.email,
    displayName: csr.displayName,
    status: csr.status,
    emailVerified: Boolean(csr.emailVerifiedAt),
    roles: roleNames(csr),
  };
}

async function requireCsr(actorId: string, permission: Permission): Promise<CsrWithRoles> {
  const actor = await prisma.csr.findUnique({ where: { id: actorId }, select: csrIdentitySelect });
  if (!actor || actor.status !== CsrStatus.ACTIVE) {
    throw new CsrError("UNAUTHENTICATED", "Sign in as an active CSR");
  }
  if (!hasPermission(roleNames(actor), permission)) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  return actor;
}

async function assertAdminRemains(csrId: string, nextRoles: CsrRoleName[], disabling: boolean): Promise<void> {
  if (!disabling && nextRoles.includes(CsrRoleName.ADMIN)) return;
  const other = await prisma.csr.findFirst({
    where: {
      id: { not: csrId },
      status: { not: CsrStatus.DISABLED },
      roles: { some: { role: CsrRoleName.ADMIN } },
    },
    select: { id: true },
  });
  if (!other) {
    throw new CsrError("INVALID", "At least one active admin is required");
  }
}

export async function inviteCsr(
  actorId: string,
  input: {
    name: string;
    surname: string;
    email: string;
    displayName: string;
    roles: CsrRoleName[];
  },
) {
  await requireCsr(actorId, "csr:manage");
  if (input.roles.length === 0) {
    throw new CsrError("INVALID", "Assign at least one role");
  }
  const existing = await prisma.csr.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    throw new CsrError("CONFLICT", "A CSR with this email already exists");
  }
  const token = createInviteToken();
  const csr = await prisma.csr.create({
    data: {
      name: input.name,
      surname: input.surname,
      email: input.email,
      displayName: input.displayName,
      status: CsrStatus.INVITED,
      inviteTokenHash: hashInviteToken(token),
      roles: { create: input.roles.map((role) => ({ role })) },
    },
    select: csrIdentitySelect,
  });
  return { csr: toPublicCsr(csr), inviteToken: token };
}

export async function deleteUnactivatedInvite(id: string) {
  await prisma.csr.deleteMany({ where: { id, status: CsrStatus.INVITED } });
}

export async function acceptInvite(token: string, password: string) {
  if (password.length < 8) {
    throw new CsrError("INVALID", "Password must be at least 8 characters");
  }
  const csr = await prisma.csr.findUnique({
    where: { inviteTokenHash: hashInviteToken(token) },
    select: csrIdentitySelect,
  });
  if (!csr || csr.status !== CsrStatus.INVITED) {
    throw new CsrError("NOT_FOUND", "Invite is no longer valid");
  }
  const verificationToken = createInviteToken();
  const updated = await prisma.csr.update({
    where: { id: csr.id },
    data: {
      status: CsrStatus.ACTIVE,
      passwordHash: hashPassword(password),
      inviteTokenHash: null,
      emailVerifiedAt: null,
      emailVerificationTokenHash: hashInviteToken(verificationToken),
    },
    select: csrIdentitySelect,
  });
  return { csr: toPublicCsr(updated), verificationToken };
}

export async function verifyEmail(token: string) {
  const csr = await prisma.csr.findUnique({
    where: { emailVerificationTokenHash: hashInviteToken(token) },
    select: { id: true, status: true },
  });
  if (!csr || csr.status !== CsrStatus.ACTIVE) {
    throw new CsrError("NOT_FOUND", "This verification link is no longer valid");
  }
  await prisma.csr.update({
    where: { id: csr.id },
    data: { emailVerifiedAt: new Date(), emailVerificationTokenHash: null },
  });
}

const RESEND_WINDOW_MS = 60 * 1000;

export async function resendVerification(actorId: string) {
  const csr = await prisma.csr.findUnique({
    where: { id: actorId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      emailVerificationTokenHash: true,
      updatedAt: true,
    },
  });
  if (!csr || csr.status !== CsrStatus.ACTIVE) {
    throw new CsrError("UNAUTHENTICATED", "Sign in as an active CSR");
  }
  if (csr.emailVerifiedAt) {
    throw new CsrError("INVALID", "This email is already verified");
  }
  if (csr.emailVerificationTokenHash && Date.now() - csr.updatedAt.getTime() < RESEND_WINDOW_MS) {
    throw new CsrError("INVALID", "Please wait a minute before requesting another email");
  }
  const token = createInviteToken();
  await prisma.csr.update({
    where: { id: csr.id },
    data: { emailVerificationTokenHash: hashInviteToken(token) },
  });
  return { token, email: csr.email, name: csr.name };
}

export async function loginCsr(email: string, password: string) {
  const csr = await prisma.csr.findUnique({ where: { email }, select: { ...csrIdentitySelect, passwordHash: true } });
  if (!csr || csr.status !== CsrStatus.ACTIVE || !csr.passwordHash || !verifyPassword(password, csr.passwordHash)) {
    throw new CsrError("UNAUTHENTICATED", "Email or password is incorrect");
  }
  return toPublicCsr(csr);
}

export async function currentCsr(actorId: string) {
  const csr = await prisma.csr.findUnique({ where: { id: actorId }, select: csrIdentitySelect });
  if (!csr || csr.status !== CsrStatus.ACTIVE) {
    throw new CsrError("UNAUTHENTICATED", "Sign in as an active CSR");
  }
  return toPublicCsr(csr);
}

export async function listCsrs(actorId: string) {
  await requireCsr(actorId, "csr:read");
  const csrs = await prisma.csr.findMany({
    select: csrIdentitySelect,
    orderBy: [{ surname: "asc" }, { name: "asc" }],
  });
  return csrs.map(toPublicCsr);
}

export async function cancelInvite(actorId: string, csrId: string) {
  await requireCsr(actorId, "csr:manage");
  const removed = await prisma.csr.deleteMany({ where: { id: csrId, status: CsrStatus.INVITED } });
  if (removed.count !== 1) {
    throw new CsrError("NOT_FOUND", "That invite is no longer open");
  }
}

export async function updateCsrAccess(
  actorId: string,
  csrId: string,
  input: { status?: CsrStatus; roles?: CsrRoleName[] },
) {
  await requireCsr(actorId, "csr:manage");
  const csr = await prisma.csr.findUnique({
    where: { id: csrId },
    select: { id: true, status: true, roles: roleSelect },
  });
  if (!csr) {
    throw new CsrError("NOT_FOUND", "CSR not found");
  }
  if (input.status === CsrStatus.INVITED) {
    throw new CsrError("INVALID", "An account cannot be moved back to invited");
  }
  if (input.roles && input.roles.length === 0) {
    throw new CsrError("INVALID", "Assign at least one role");
  }
  const nextStatus = input.status ?? csr.status;
  const nextRoles = input.roles ?? roleNames(csr);
  await assertAdminRemains(csr.id, nextRoles, nextStatus === CsrStatus.DISABLED);
  const updated = await prisma.csr.update({
    where: { id: csrId },
    data: {
      status: nextStatus,
      ...(input.roles ? { roles: { deleteMany: {}, create: input.roles.map((role) => ({ role })) } } : {}),
    },
    select: csrIdentitySelect,
  });
  return toPublicCsr(updated);
}

const RESET_WINDOW_MS = 60 * 60 * 1000;

export async function requestPasswordReset(email: string) {
  const csr = await prisma.csr.findUnique({ where: { email }, select: { id: true, name: true, status: true } });
  if (!csr || csr.status !== CsrStatus.ACTIVE) {
    return { token: null, name: null };
  }
  const token = createInviteToken();
  await prisma.csr.update({
    where: { id: csr.id },
    data: {
      passwordResetTokenHash: hashInviteToken(token),
      passwordResetExpiresAt: new Date(Date.now() + RESET_WINDOW_MS),
    },
  });
  return { token, name: csr.name };
}

export async function clearPasswordReset(email: string) {
  await prisma.csr.updateMany({
    where: { email },
    data: { passwordResetTokenHash: null, passwordResetExpiresAt: null },
  });
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) {
    throw new CsrError("INVALID", "Password must be at least 8 characters");
  }
  const csr = await prisma.csr.findUnique({
    where: { passwordResetTokenHash: hashInviteToken(token) },
    select: { id: true, status: true, passwordResetExpiresAt: true },
  });
  if (!csr || csr.status !== CsrStatus.ACTIVE || !csr.passwordResetExpiresAt || csr.passwordResetExpiresAt < new Date()) {
    throw new CsrError("NOT_FOUND", "This reset link is no longer valid");
  }
  await prisma.csr.update({
    where: { id: csr.id },
    data: {
      passwordHash: hashPassword(password),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
}
