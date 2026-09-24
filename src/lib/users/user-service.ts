import { CustomerEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentCsr, CsrError } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import { AccountUpdateEmail } from "@/lib/email/account-update-email";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { accountDetailChanges, parseAccountDetails, type AccountDetails } from "@/lib/users/account-details";
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
    select: { id: true, description: true, amount: true, failureReason: true, purchasedAt: true },
  },
  events: {
    where: { type: { notIn: [CustomerEventType.PAYMENT_RECEIVED, CustomerEventType.PAYMENT_FAILED] } },
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: { id: true, type: true, summary: true, createdAt: true },
  },
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export async function paymentRequest(actorId: string, membershipId: string, purchaseId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: {
      firstName: true,
      membershipId: true,
      vehicles: { orderBy: { createdAt: "asc" }, take: 1, select: { year: true, make: true, model: true } },
      purchases: { where: { id: purchaseId, failureReason: { not: null } }, select: { description: true, amount: true, failureReason: true } },
    },
  });
  const purchase = customer?.purchases[0];
  if (!customer || !purchase?.failureReason) {
    throw new CsrError("NOT_FOUND", "That failed payment could not be found");
  }
  const vehicle = customer.vehicles[0];
  const vehicleName = vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : "";
  return {
    to: actor.email,
    name: customer.firstName,
    membershipId: customer.membershipId,
    description: vehicleName ? `${purchase.description} on ${vehicleName}` : purchase.description,
    amount: money.format(Number(purchase.amount)),
    reason: purchase.failureReason,
  };
}

export async function updateCustomerDetails(actorId: string, membershipId: string, input: { firstName: string; lastName: string; email: string; phone: string }) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:update")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const parsed = parseAccountDetails(input);
  if ("error" in parsed) throw new CsrError("INVALID", parsed.error);
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: { id: true, membershipId: true, firstName: true, lastName: true, email: true, phone: true },
  });
  if (!customer) throw new CsrError("NOT_FOUND", "That customer could not be found");
  const next: AccountDetails = parsed.value;
  const taken = await prisma.user.findFirst({
    where: { email: { equals: next.email, mode: "insensitive" }, NOT: { id: customer.id } },
    select: { id: true },
  });
  if (taken) throw new CsrError("CONFLICT", "That email is already on another membership");
  const changes = accountDetailChanges(customer, next);
  if (changes.length === 0) return;
  const summary = `Account details updated by CSR. ${changes.join(" ")}`.slice(0, 500);
  await prisma.$transaction([
    prisma.user.update({ where: { id: customer.id }, data: next }),
    prisma.customerEvent.create({
      data: { userId: customer.id, type: "ACCOUNT_UPDATED", summary, createdAt: new Date() },
    }),
  ]);
  await createEmailService().send(
    actor.email,
    new AccountUpdateEmail(appUrl(), next.firstName, customer.membershipId, changes),
  );
}

export async function publicPaymentDue(membershipId: string) {
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" }, status: "OVERDUE" },
    select: {
      firstName: true,
      membershipId: true,
      vehicles: { orderBy: { createdAt: "asc" }, take: 1, select: { year: true, make: true, model: true } },
      purchases: { where: { failureReason: { not: null } }, orderBy: { purchasedAt: "desc" }, take: 1, select: { description: true, amount: true } },
    },
  });
  const purchase = customer?.purchases[0];
  if (!customer || !purchase) return null;
  const vehicle = customer.vehicles[0];
  const vehicleName = vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : "";
  return {
    name: customer.firstName,
    membershipId: customer.membershipId,
    description: vehicleName ? `${purchase.description} on ${vehicleName}` : purchase.description,
    amount: money.format(Number(purchase.amount)),
  };
}

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
