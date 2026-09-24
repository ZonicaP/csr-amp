import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentCsr, CsrError } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import { phoneDigits, searchTokens, type UserListItem } from "@/lib/users/user-list";

export const USER_PAGE_SIZE = 10;

export type { UserListItem };

type UserPage = {
  users: UserListItem[];
  total: number;
};

type Queryable = {
  $queryRaw: typeof prisma.$queryRaw;
};

function containsPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

function exactWhere(tokens: string[]) {
  if (tokens.length === 0) return Prisma.sql`TRUE`;
  return Prisma.join(
    tokens.map((token) => {
      const pattern = containsPattern(token);
      const clauses = [
        Prisma.sql`"firstName" ILIKE ${pattern} ESCAPE '\\'`,
        Prisma.sql`"lastName" ILIKE ${pattern} ESCAPE '\\'`,
        Prisma.sql`email ILIKE ${pattern} ESCAPE '\\'`,
        Prisma.sql`phone ILIKE ${pattern} ESCAPE '\\'`,
        Prisma.sql`"membershipId" ILIKE ${pattern} ESCAPE '\\'`,
      ];
      const digits = phoneDigits(token);
      const membershipKey = token.replace(/[^a-z0-9]/gi, "");
      if (digits) clauses.push(Prisma.sql`"phoneDigits" ILIKE ${containsPattern(digits)} ESCAPE '\\'`);
      if (membershipKey) clauses.push(Prisma.sql`"membershipIdKey" ILIKE ${containsPattern(membershipKey)} ESCAPE '\\'`);
      return Prisma.sql`(${Prisma.join(clauses, " OR ")})`;
    }),
    " AND ",
  );
}

function approximateWhere(tokens: string[]) {
  return Prisma.join(
    tokens.map(
      (token) => Prisma.sql`(
        ${token} <% "firstName"
        OR ${token} <% "lastName"
        OR ${token} <% email
      )`,
    ),
    " AND ",
  );
}

async function queryUserPage(db: Queryable, where: Prisma.Sql, page: number): Promise<UserPage> {
  const offset = (page - 1) * USER_PAGE_SIZE;
  const rows = await db.$queryRaw<Array<UserListItem & { total: number }>>`
    WITH matched AS (
      SELECT id, "membershipId", "firstName", "lastName", email, phone, status::text AS status
      FROM "User"
      WHERE ${where}
    )
    SELECT matched.id, matched."membershipId", matched."firstName", matched."lastName",
           matched.email, matched.phone, matched.status, counted.total
    FROM (SELECT count(*)::int AS total FROM matched) counted
    LEFT JOIN (
      SELECT * FROM matched
      ORDER BY "lastName" ASC, "firstName" ASC
      LIMIT ${USER_PAGE_SIZE} OFFSET ${offset}
    ) matched ON true
  `;
  const total = rows[0]?.total ?? 0;
  const users = rows.flatMap(({ total: _total, ...user }) => (user.id ? [user] : []));
  return { users, total };
}

export async function listUsers(actorId: string, query: string, page: number) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const tokens = searchTokens(query);
  const exact = await queryUserPage(prisma, exactWhere(tokens), safePage);
  if (exact.total > 0 || tokens.length === 0) {
    return { ...exact, page: safePage, pageSize: USER_PAGE_SIZE, approximate: false };
  }
  return listApproximateUsers(tokens, safePage);
}

async function listApproximateUsers(tokens: string[], page: number) {
  const pageResult = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('pg_trgm.word_similarity_threshold', '0.55', true)`;
    return queryUserPage(tx, approximateWhere(tokens), page);
  });
  return { ...pageResult, page, pageSize: USER_PAGE_SIZE, approximate: pageResult.total > 0 };
}

const customerSelect = {
  id: true,
  membershipId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  vehicles: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      licensePlate: true,
      make: true,
      model: true,
      year: true,
      subscriptions: {
        orderBy: { startedAt: "desc" as const },
        select: { id: true, planName: true, status: true, startedAt: true },
      },
    },
  },
  purchases: {
    orderBy: { purchasedAt: "desc" as const },
    select: { id: true, description: true, amount: true, purchasedAt: true },
  },
  events: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: { id: true, type: true, summary: true, createdAt: true },
  },
};

export async function getCustomer(actorId: string, membershipId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  return prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: customerSelect,
  });
}
