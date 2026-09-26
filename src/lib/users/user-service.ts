import { CustomerEventType, Prisma } from "@prisma/client";
import { attachCallEvent, openCallLink } from "@/lib/calls/call-service";
import { prisma } from "@/lib/prisma";
import { currentCsr, CsrError } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import { AccountUpdateEmail } from "@/lib/email/account-update-email";
import { PaymentRequestEmail } from "@/lib/email/payment-request-email";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { accountDetailChanges, parseAccountDetails, type AccountDetails } from "@/lib/users/account-details";
import { overduePaymentDue, paymentLinkDescription } from "@/lib/users/overdue";
import { parsePlate } from "@/lib/users/plate";
import { newestVehicleYear, oldestVehicleYear } from "@/lib/users/vehicle-year";
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
  const rows = await db.$queryRaw<Array<UserListItem & { total: number | null }>>`
    SELECT page.id, page."membershipId", page."firstName", page."lastName",
           page.email, page.phone, page.status, counted.total
    FROM (SELECT count(*)::int AS total FROM "User" WHERE ${where}) counted
    LEFT JOIN LATERAL (
      SELECT id, "membershipId", "firstName", "lastName", email, phone, status::text AS status
      FROM "User"
      WHERE ${where}
      ORDER BY "lastName" ASC, "firstName" ASC
      LIMIT ${USER_PAGE_SIZE} OFFSET ${offset}
    ) page ON true
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
    select: { id: true, vehicleId: true, description: true, amount: true, failureReason: true, purchasedAt: true },
  },
  events: {
    where: { type: { notIn: [CustomerEventType.PAYMENT_RECEIVED, CustomerEventType.PAYMENT_FAILED] } },
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: { id: true, type: true, summary: true, createdAt: true, call: { select: { reference: true } } },
  },
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export async function sendPaymentLink(actorId: string, membershipId: string, purchaseId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const link = await openCallLink(actorId);
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: {
      id: true,
      firstName: true,
      membershipId: true,
      vehicles: { orderBy: { createdAt: "asc" }, take: 1, select: { year: true, make: true, model: true } },
      purchases: { where: { id: purchaseId, failureReason: { not: null } }, select: { description: true, amount: true, failureReason: true } },
    },
  });
  const purchase = customer?.purchases[0] ?? null;
  const vehicle = customer?.vehicles[0];
  const vehicleName = vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : "";
  const payment = paymentLinkDescription(purchase, vehicleName);
  if (!customer || !purchase?.failureReason || !payment.ok) throw new CsrError("NOT_FOUND", "That failed payment could not be found");
  const description = payment.description;
  await createEmailService().send(
    actor.email,
    new PaymentRequestEmail(appUrl(), customer.firstName, description, money.format(Number(purchase.amount)), purchase.failureReason, customer.membershipId),
  );
  await attachCallEvent(link, customer.id, "ACCOUNT_UPDATED", `Payment link sent for ${description}.`);
}

export async function updateCustomerDetails(actorId: string, membershipId: string, input: { firstName: string; lastName: string; email: string; phone: string }) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:update")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const link = await openCallLink(actorId);
  const parsed = parseAccountDetails(input);
  if ("error" in parsed) throw new CsrError("INVALID", parsed.error);
  const next: AccountDetails = parsed.value;
  const rows = await prisma.$queryRaw<Array<AccountDetails & { id: string; membershipId: string; taken: boolean }>>`
    SELECT customer.id, customer."membershipId", customer."firstName", customer."lastName", customer.email, customer.phone,
           EXISTS (
             SELECT 1 FROM "User" other
             WHERE lower(other.email) = lower(${next.email}) AND other.id <> customer.id
           ) AS taken
    FROM "User" customer
    WHERE lower(customer."membershipId") = lower(${membershipId})
    LIMIT 1
  `;
  const customer = rows[0];
  if (!customer) throw new CsrError("NOT_FOUND", "That customer could not be found");
  if (customer.taken) throw new CsrError("CONFLICT", "That email is already on another membership");
  const changes = accountDetailChanges(customer, next);
  if (changes.length === 0) return;
  const summary = `Account details updated by CSR. ${changes.join(" ")}`.slice(0, 500);
  await prisma.$transaction([
    prisma.user.update({ where: { id: customer.id }, data: next }),
    prisma.customerEvent.create({
      data: { userId: customer.id, type: "ACCOUNT_UPDATED", summary, createdAt: new Date(), ...link },
    }),
  ]);
  await createEmailService().send(
    actor.email,
    new AccountUpdateEmail(appUrl(), next.firstName, customer.membershipId, changes),
  );
}

export async function updateVehiclePlate(actorId: string, membershipId: string, vehicleId: string, plate: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:update")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const link = await openCallLink(actorId);
  const parsed = parsePlate(plate);
  if ("error" in parsed) throw new CsrError("INVALID", parsed.error);
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: {
      id: true,
      vehicles: { where: { id: vehicleId }, select: { id: true, year: true, make: true, model: true, licensePlate: true } },
    },
  });
  const vehicle = customer?.vehicles[0];
  if (!customer || !vehicle) throw new CsrError("NOT_FOUND", "That vehicle could not be found");
  if (vehicle.licensePlate === parsed.value) return;
  const label = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "vehicle";
  const summary = `Plate changed from ${vehicle.licensePlate ?? "none"} to ${parsed.value} on ${label}.`.slice(0, 500);
  await prisma.$transaction([
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { licensePlate: parsed.value } }),
    prisma.customerEvent.create({
      data: { userId: customer.id, type: "ACCOUNT_UPDATED", summary, createdAt: new Date(), ...link },
    }),
  ]);
}

function vehicleText(value: string, label: string): { value: string } | { error: string } {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text.length > 40) return { error: `Enter the ${label}` };
  return { value: text };
}

export async function createVehicle(
  actorId: string,
  membershipId: string,
  input: { year: string; make: string; model: string; plate: string },
) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:update")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const link = await openCallLink(actorId);
  const plate = parsePlate(input.plate);
  if ("error" in plate) throw new CsrError("INVALID", plate.error);
  const make = vehicleText(input.make, "make");
  if ("error" in make) throw new CsrError("INVALID", make.error);
  const model = vehicleText(input.model, "model");
  if ("error" in model) throw new CsrError("INVALID", model.error);
  const yearText = input.year.trim();
  const year = yearText.length === 0 ? null : Number(yearText);
  const newest = newestVehicleYear();
  if (year !== null && (!Number.isInteger(year) || year < oldestVehicleYear || year > newest)) {
    throw new CsrError("INVALID", `Choose a year from ${oldestVehicleYear} to ${newest}`);
  }
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: { id: true, vehicles: { select: { licensePlate: true } } },
  });
  if (!customer) throw new CsrError("NOT_FOUND", "That customer could not be found");
  if (customer.vehicles.some((vehicle) => vehicle.licensePlate?.toUpperCase() === plate.value)) {
    throw new CsrError("CONFLICT", "That plate is already on this membership");
  }
  const label = [year, make.value, model.value].filter(Boolean).join(" ");
  const summary = `Vehicle added: ${label} (${plate.value}).`.slice(0, 500);
  await prisma.$transaction([
    prisma.vehicle.create({
      data: { userId: customer.id, year, make: make.value, model: model.value, licensePlate: plate.value },
    }),
    prisma.customerEvent.create({
      data: { userId: customer.id, type: "ACCOUNT_UPDATED", summary, createdAt: new Date(), ...link },
    }),
  ]);
}

export async function publicPaymentDue(membershipId: string) {
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" }, status: "OVERDUE" },
    select: {
      firstName: true,
      membershipId: true,
      vehicles: { orderBy: { createdAt: "asc" }, take: 1, select: { year: true, make: true, model: true } },
      purchases: { where: { failureReason: { not: null } }, orderBy: { purchasedAt: "desc" }, take: 1, select: { description: true, amount: true, failureReason: true } },
    },
  });
  const purchase = customer?.purchases[0] ?? null;
  const vehicle = customer?.vehicles[0];
  const vehicleName = vehicle ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") : "";
  const due = overduePaymentDue(customer ? "OVERDUE" : "ACTIVE", purchase, vehicleName);
  if (!customer || !purchase || !due) return null;
  return {
    name: customer.firstName,
    membershipId: customer.membershipId,
    description: due.description,
    amount: money.format(Number(purchase.amount)),
  };
}

export function readCustomer(membershipId: string) {
  return prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: customerSelect,
  });
}

export async function getCustomer(actorId: string, membershipId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  return readCustomer(membershipId);
}
