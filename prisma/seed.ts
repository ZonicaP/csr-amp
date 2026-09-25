import { AccountStatus, CsrRoleName, CsrStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma.ts";
import { hashPassword } from "../src/lib/csr/password.ts";
import { georgiaPlate } from "../src/lib/users/plate.ts";

async function main() {
  const email = process.env.CSR_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.CSR_ADMIN_PASSWORD;
  const name = process.env.CSR_ADMIN_NAME ?? "AMP";
  const surname = process.env.CSR_ADMIN_SURNAME ?? "Admin";
  if (!email || !password) {
    throw new Error("Set CSR_ADMIN_EMAIL and CSR_ADMIN_PASSWORD before seeding");
  }
  if (password.length < 8) {
    throw new Error("CSR_ADMIN_PASSWORD must be at least 8 characters");
  }

  const existing = await prisma.csr.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists for ${email}`);
  } else {
    await prisma.csr.create({
      data: {
        name,
        surname,
        email,
        displayName: `${name} ${surname}`,
        status: CsrStatus.ACTIVE,
        passwordHash: hashPassword(password),
        emailVerifiedAt: new Date(),
        roles: { create: [{ role: CsrRoleName.ADMIN }] },
      },
    });
    console.log(`Seeded admin ${email}`);
  }

  await seedCustomers();
}

async function seedCustomers() {
  await prisma.user.deleteMany({ where: { email: { endsWith: "@example.com" } } });
  const firstNames = ["Ava", "Noah", "Mia", "Liam", "Sofia", "Ethan", "Amelia", "Lucas"];
  const lastNames = ["Nguyen", "Patel", "Brooks", "Diaz", "Keller", "Okonkwo"];
  const statuses = [AccountStatus.ACTIVE, AccountStatus.OVERDUE, AccountStatus.CANCELLED];
  const users = firstNames.flatMap((firstName, firstIndex) =>
    lastNames.map((lastName, lastIndex) => {
      const index = firstIndex * lastNames.length + lastIndex;
      return {
        firstName,
        lastName,
        email: `${firstName}.${lastName}@example.com`.toLowerCase(),
        phone: `555-010-${String(index + 1).padStart(2, "0")}`,
        membershipId: `AMP-${String(10001 + index)}`,
        status: statuses[index % statuses.length],
        createdAt: new Date(Date.UTC(2024, 0, 15, 16)),
      };
    }),
  );
  await prisma.user.createMany({ data: users });
  const created = await prisma.user.findMany({
    where: { email: { endsWith: "@example.com" } },
    select: { id: true, status: true },
    orderBy: { membershipId: "asc" },
  });
  const plans = ["Unlimited Wash", "Basic Wash", "The Works"];
  const cars = [
    { make: "Toyota", model: "Camry" },
    { make: "Honda", model: "CR-V" },
    { make: "Tesla", model: "Model 3" },
  ];
  for (const [index, customer] of created.entries()) {
    const car = cars[index % cars.length];
    const plan = plans[index % plans.length];
    const year = 2018 + (index % 7);
    const vehicleName = `${year} ${car.make} ${car.model}`;
    const amount = [39.99, 19.99, 49.99][index % 3];
    const price = `$${amount.toFixed(2)}`;
    const declineReasons = [
      "Card declined, insufficient funds",
      "Card expired",
      "Card declined, do not honor",
    ];
    const declineReason = declineReasons[Math.floor(index / 3) % declineReasons.length];
    const openedAt = new Date(Date.UTC(2024, 0, 15, 16));
    const renewedAt = new Date(Date.UTC(2025, 0, 12, 16));
    const latestAt = new Date(Date.UTC(2025, customer.status === AccountStatus.ACTIVE ? 7 : 5, 12, 16));
    await prisma.vehicle.create({
      data: {
        userId: customer.id,
        make: car.make,
        model: car.model,
        year,
        licensePlate: georgiaPlate(index),
        subscriptions: {
          create: {
            planName: plan,
            status: customer.status === AccountStatus.CANCELLED ? "CANCELLED" : "ACTIVE",
            startedAt: openedAt,
          },
        },
      },
    });
    const payments = [new Date(Date.UTC(2024, 5, 12, 16)), renewedAt];
    if (customer.status === AccountStatus.ACTIVE) payments.push(latestAt);
    await prisma.purchase.createMany({
      data: [
        ...payments.map((purchasedAt) => ({
          userId: customer.id,
          description: plan,
          amount,
          purchasedAt,
        })),
        ...(customer.status === AccountStatus.OVERDUE
          ? [{ userId: customer.id, description: plan, amount, failureReason: declineReason, purchasedAt: latestAt }]
          : []),
      ],
    });
    const events: { type: "ACCOUNT_OPENED" | "PLAN_STARTED" | "PAYMENT_RECEIVED" | "PAYMENT_FAILED" | "ACCOUNT_OVERDUE" | "PLAN_CANCELLED" | "ACCOUNT_CANCELLED"; summary: string; createdAt: Date }[] = [
      { type: "ACCOUNT_OPENED", summary: "Account opened", createdAt: openedAt },
      { type: "PLAN_STARTED", summary: `${plan} started on ${vehicleName}`, createdAt: openedAt },
      ...payments.map((createdAt) => ({
        type: "PAYMENT_RECEIVED" as const,
        summary: `Payment of ${price} received for ${plan}`,
        createdAt,
      })),
    ];
    if (customer.status === AccountStatus.OVERDUE) {
      events.push(
        { type: "PAYMENT_FAILED", summary: `Payment of ${price} failed for ${plan}. ${declineReason}`, createdAt: latestAt },
        { type: "ACCOUNT_OVERDUE", summary: `Account marked overdue. ${declineReason}`, createdAt: new Date(Date.UTC(2025, 5, 13, 16)) },
      );
    }
    if (customer.status === AccountStatus.CANCELLED) {
      events.push(
        { type: "PLAN_CANCELLED", summary: `${plan} cancelled on ${vehicleName}`, createdAt: latestAt },
        { type: "ACCOUNT_CANCELLED", summary: "Account cancelled", createdAt: new Date(latestAt.getTime() + 60_000) },
      );
    }
    await prisma.customerEvent.createMany({
      data: events.map((event) => ({ userId: customer.id, ...event })),
    });
  }
  console.log(`Seeded ${users.length} customers`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
