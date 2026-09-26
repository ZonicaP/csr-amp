import type { Prisma } from "@prisma/client";

export function callSearchWhere(query: string): Prisma.CallWhereInput {
  const tokens = query.trim().split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) return {};
  return {
    AND: tokens.map((token) => ({
      OR: [
        { reference: { contains: token, mode: "insensitive" } },
        { csr: { name: { contains: token, mode: "insensitive" } } },
        { csr: { surname: { contains: token, mode: "insensitive" } } },
        { csr: { email: { contains: token, mode: "insensitive" } } },
        { user: { firstName: { contains: token, mode: "insensitive" } } },
        { user: { lastName: { contains: token, mode: "insensitive" } } },
        { user: { email: { contains: token, mode: "insensitive" } } },
        { user: { membershipId: { contains: token, mode: "insensitive" } } },
        { events: { some: { user: { firstName: { contains: token, mode: "insensitive" } } } } },
        { events: { some: { user: { lastName: { contains: token, mode: "insensitive" } } } } },
        { events: { some: { user: { email: { contains: token, mode: "insensitive" } } } } },
        { events: { some: { user: { membershipId: { contains: token, mode: "insensitive" } } } } },
      ],
    })),
  };
}

export function callListWhere(query: string, callbacksOnly: boolean): Prisma.CallWhereInput {
  const text = callSearchWhere(query);
  if (!callbacksOnly) return text;
  const status = { status: "CALLBACK" as const };
  if (Object.keys(text).length === 0) return status;
  return { AND: [text, status] };
}
