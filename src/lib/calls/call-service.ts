import { Prisma, type CustomerEventType } from "@prisma/client";
import { callListWhere } from "@/lib/calls/call-search";
import { randomCallReference } from "@/lib/calls/reference";
import { currentCsr, CsrError } from "@/lib/csr/csr-service";
import { canEscalateCall, hasPermission } from "@/lib/csr/permissions";
import { prisma } from "@/lib/prisma";

const noteLimit = 1000;

const eventSelect = {
  id: true,
  summary: true,
  createdAt: true,
  user: { select: { membershipId: true, firstName: true, lastName: true } },
} as const;

export type OpenCall = {
  reference: string;
  customer: { membershipId: string; firstName: string; lastName: string } | null;
};

export function lookupOpenCall(csrId: string) {
  return prisma.call
    .findFirst({
      where: { csrId, status: "OPEN" },
      select: { reference: true, user: { select: { membershipId: true, firstName: true, lastName: true } } },
    })
    .then((call) => (call ? { reference: call.reference, customer: call.user } : null));
}

export async function openCall(actorId: string) {
  await currentCsr(actorId);
  return lookupOpenCall(actorId);
}

export async function openCallLink(csrId: string) {
  const call = await prisma.call.findFirst({
    where: { csrId, status: "OPEN" },
    select: { id: true },
  });
  if (!call) return { csrId };
  return { callId: call.id, csrId };
}

export async function callLink(actorId: string) {
  await currentCsr(actorId);
  return openCallLink(actorId);
}

export async function attachCallEvent(
  link: { callId?: string; csrId: string },
  userId: string,
  type: CustomerEventType,
  summary: string,
) {
  await prisma.customerEvent.create({
    data: {
      userId,
      type,
      summary: summary.slice(0, 500),
      createdAt: new Date(),
      csrId: link.csrId,
      ...(link.callId ? { callId: link.callId } : {}),
    },
  });
}

export async function recordOnCall(actorId: string, userId: string, type: CustomerEventType, summary: string) {
  await attachCallEvent(await callLink(actorId), userId, type, summary);
}

export async function startCall(actorId: string) {
  const actor = await currentCsr(actorId);
  const open = await prisma.call.findFirst({ where: { csrId: actor.id, status: "OPEN" }, select: { reference: true } });
  if (open) throw new CsrError("CONFLICT", "End the open call before starting another");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const call = await prisma.call.create({
        data: { reference: randomCallReference(), csrId: actor.id, status: "OPEN" },
        select: { reference: true },
      });
      return call;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const blocked = await prisma.call.findFirst({ where: { csrId: actor.id, status: "OPEN" }, select: { id: true } });
      if (blocked) throw new CsrError("CONFLICT", "End the open call before starting another");
    }
  }
  throw new CsrError("CONFLICT", "A call reference could not be reserved. Try again");
}

export async function linkCaller(actorId: string, membershipId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission to link a caller");
  }
  const call = await prisma.call.findFirst({ where: { csrId: actorId, status: "OPEN" }, select: { id: true, reference: true } });
  if (!call) throw new CsrError("NOT_FOUND", "There is no open call");
  const userId = await customerIdFor(membershipId);
  if (!userId) throw new CsrError("NOT_FOUND", "That customer could not be found");
  const updated = await prisma.call.updateMany({
    where: { id: call.id, csrId: actorId, status: "OPEN" },
    data: { userId },
  });
  if (updated.count !== 1) throw new CsrError("CONFLICT", "That call is no longer open");
  return { reference: call.reference };
}

export async function unlinkCaller(actorId: string) {
  await currentCsr(actorId);
  const updated = await prisma.call.updateMany({
    where: { csrId: actorId, status: "OPEN" },
    data: { userId: null },
  });
  if (updated.count !== 1) throw new CsrError("NOT_FOUND", "There is no open call");
}

export async function endCall(actorId: string, input: { gaveReference: boolean; confirmedNothingElse: boolean; notes?: string }) {
  if (input.gaveReference !== true || input.confirmedNothingElse !== true) {
    throw new CsrError("INVALID", "Confirm both closing steps before ending the call");
  }
  const call = await openCallRow(actorId);
  const notes = optionalNote(input.notes);
  const updated = await prisma.call.updateMany({
    where: { id: call.id, csrId: actorId, status: "OPEN" },
    data: {
      status: "CLOSED",
      endedAt: new Date(),
      gaveReference: true,
      confirmedNothingElse: true,
      closingNotes: notes,
    },
  });
  if (updated.count !== 1) throw new CsrError("CONFLICT", "That call is no longer open");
  return { reference: call.reference };
}

export async function requestCallback(actorId: string, note: string) {
  const call = await openCallRow(actorId);
  const updated = await prisma.call.updateMany({
    where: { id: call.id, csrId: actorId, status: "OPEN" },
    data: {
      status: "CALLBACK",
      endedAt: new Date(),
      callbackNote: requiredNote(note, "Add a note before requesting a call back"),
    },
  });
  if (updated.count !== 1) throw new CsrError("CONFLICT", "That call is no longer open");
  return { reference: call.reference };
}

export async function listEscalationSupervisors(actorId: string) {
  const actor = await currentCsr(actorId);
  if (!canEscalateCall(actor.roles)) throw new CsrError("FORBIDDEN", "Only an agent can escalate a call");
  return prisma.csr.findMany({
    where: { status: "ACTIVE", roles: { some: { role: "SUPERVISOR" } } },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });
}

export async function escalateCall(actorId: string, supervisorId: string, note: string) {
  const actor = await currentCsr(actorId);
  if (!canEscalateCall(actor.roles)) throw new CsrError("FORBIDDEN", "Only an agent can escalate a call");
  const callbackNote = requiredNote(note, "Add a note before escalating the call");
  const call = await prisma.call.findFirst({ where: { csrId: actorId, status: "OPEN" }, select: { id: true, reference: true } });
  if (!call) throw new CsrError("NOT_FOUND", "There is no open call");
  const supervisor = await prisma.csr.findFirst({
    where: { id: supervisorId, status: "ACTIVE", roles: { some: { role: "SUPERVISOR" } } },
    select: { id: true },
  });
  if (!supervisor) {
    const available = await prisma.csr.count({ where: { status: "ACTIVE", roles: { some: { role: "SUPERVISOR" } } } });
    if (available === 0) throw new CsrError("CONFLICT", "No supervisor is available");
    throw new CsrError("INVALID", "Choose an active supervisor");
  }
  const endedAt = new Date();
  const updated = await prisma.call.updateMany({
    where: { id: call.id, csrId: actorId, status: "OPEN" },
    data: {
      status: "CALLBACK",
      endedAt,
      callbackNote,
      csrId: supervisor.id,
      escalatedAt: endedAt,
      escalatedFromCsrId: actorId,
    },
  });
  if (updated.count !== 1) throw new CsrError("CONFLICT", "That call is no longer open");
  return { reference: call.reference };
}

export async function searchCalls(actorId: string, query: string, options?: { callbacksOnly?: boolean }) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission to look up calls");
  }
  const calls = await prisma.call.findMany({
    where: callListWhere(query, options?.callbacksOnly === true),
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      reference: true,
      status: true,
      startedAt: true,
      endedAt: true,
      closingNotes: true,
      callbackNote: true,
      escalatedAt: true,
      csr: { select: { displayName: true } },
    },
  });
  const customers = await customersOnCalls(calls.map((call) => call.id));
  return calls.map((call) => ({
    reference: call.reference,
    status: call.status,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    closingNotes: call.closingNotes,
    callbackNote: call.callbackNote,
    escalated: call.escalatedAt !== null,
    agent: call.csr.displayName,
    customers: customers.get(call.id) ?? [],
  }));
}

export async function resolveCallback(actorId: string, reference: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission to look up calls");
  }
  const normalized = reference.trim().toUpperCase();
  const call = await prisma.call.findUnique({
    where: { reference: normalized },
    select: { id: true, reference: true, status: true, endedAt: true },
  });
  if (!call) throw new CsrError("NOT_FOUND", "That call was not found");
  if (call.status !== "CALLBACK") throw new CsrError("CONFLICT", "That call is not waiting for a callback");
  const now = new Date();
  const updated = await prisma.call.updateMany({
    where: { id: call.id, status: "CALLBACK" },
    data: {
      status: "CLOSED",
      resolvedAt: now,
      ...(call.endedAt ? {} : { endedAt: now }),
    },
  });
  if (updated.count !== 1) throw new CsrError("CONFLICT", "That call is no longer waiting for a callback");
  return { reference: call.reference };
}

export async function getCall(actorId: string, reference: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission to look up calls");
  }
  const call = await prisma.call.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      startedAt: true,
      endedAt: true,
      closingNotes: true,
      callbackNote: true,
      resolvedAt: true,
      escalatedAt: true,
      csr: { select: { displayName: true } },
      escalatedFrom: { select: { displayName: true } },
      user: { select: { membershipId: true, firstName: true, lastName: true } },
      events: { orderBy: { createdAt: "asc" }, select: eventSelect },
    },
  });
  if (!call) return null;
  return {
    reference: call.reference,
    status: call.status,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    closingNotes: call.closingNotes,
    callbackNote: call.callbackNote,
    resolvedAt: call.resolvedAt,
    escalated: call.escalatedAt !== null,
    agent: call.csr.displayName,
    escalatedBy: call.escalatedFrom?.displayName ?? null,
    customer: call.user,
    events: call.events,
  };
}

function customerCallWhere(membershipId: string): Prisma.CallWhereInput {
  return {
    OR: [
      { user: { membershipId: { equals: membershipId, mode: "insensitive" } } },
      { events: { some: { user: { membershipId: { equals: membershipId, mode: "insensitive" } } } } },
    ],
  };
}

export async function callsForCustomer(actorId: string, membershipId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission to look up calls");
  }
  return prisma.call.findMany({
    where: customerCallWhere(membershipId),
    orderBy: { startedAt: "desc" },
    select: {
      reference: true,
      status: true,
      startedAt: true,
      csr: { select: { displayName: true } },
    },
  });
}

export async function callContextForCustomer(actorId: string, membershipId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission to look up calls");
  }
  return prisma.call.findMany({
    where: customerCallWhere(membershipId),
    orderBy: { startedAt: "desc" },
    take: 15,
    select: {
      reference: true,
      status: true,
      startedAt: true,
      endedAt: true,
      closingNotes: true,
      callbackNote: true,
      escalatedAt: true,
      csr: { select: { displayName: true } },
    },
  });
}

async function customerIdFor(membershipId: string | undefined) {
  const id = membershipId?.trim();
  if (!id) return null;
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: id, mode: "insensitive" } },
    select: { id: true },
  });
  return customer?.id ?? null;
}

async function openCallRow(actorId: string) {
  await currentCsr(actorId);
  const call = await prisma.call.findFirst({ where: { csrId: actorId, status: "OPEN" }, select: { id: true, reference: true } });
  if (!call) throw new CsrError("NOT_FOUND", "There is no open call");
  return call;
}

function optionalNote(note: string | undefined) {
  const trimmed = (note ?? "").trim().slice(0, noteLimit);
  return trimmed.length > 0 ? trimmed : null;
}

function requiredNote(note: string, message: string) {
  const trimmed = note.trim().slice(0, noteLimit);
  if (trimmed.length === 0) throw new CsrError("INVALID", message);
  return trimmed;
}

type CallCustomer = { membershipId: string; firstName: string; lastName: string };

async function customersOnCalls(callIds: string[]) {
  const grouped = new Map<string, CallCustomer[]>();
  if (callIds.length === 0) return grouped;
  const rows = await prisma.$queryRaw<Array<CallCustomer & { callId: string }>>`
    SELECT DISTINCT ON (e."callId", u."membershipId")
      e."callId", u."membershipId", u."firstName", u."lastName"
    FROM "CustomerEvent" e
    JOIN "User" u ON u.id = e."userId"
    WHERE e."callId" IN (${Prisma.join(callIds)})
    ORDER BY e."callId", u."membershipId", e."createdAt" ASC
  `;
  for (const row of rows) {
    const list = grouped.get(row.callId) ?? [];
    list.push({ membershipId: row.membershipId, firstName: row.firstName, lastName: row.lastName });
    grouped.set(row.callId, list);
  }
  const assigned = await prisma.call.findMany({
    where: { id: { in: callIds }, userId: { not: null } },
    select: { id: true, user: { select: { membershipId: true, firstName: true, lastName: true } } },
  });
  for (const call of assigned) {
    if (!call.user) continue;
    const list = grouped.get(call.id) ?? [];
    if (!list.some((customer) => customer.membershipId === call.user?.membershipId)) list.unshift(call.user);
    grouped.set(call.id, list);
  }
  return grouped;
}
