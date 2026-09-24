import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentCsr, CsrError } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import type { UserListItem } from "@/lib/users/user-list";

export const USER_PAGE_SIZE = 20;

export type { UserListItem };

export async function listUsers(actorId: string, query: string, page: number) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const term = query.trim();
  const where: Prisma.UserWhereInput = term
    ? {
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { phone: { contains: term, mode: "insensitive" } },
        ],
      }
    : {};
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (safePage - 1) * USER_PAGE_SIZE,
      take: USER_PAGE_SIZE,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true },
    }),
  ]);
  return { users, page: safePage, pageSize: USER_PAGE_SIZE, total };
}
