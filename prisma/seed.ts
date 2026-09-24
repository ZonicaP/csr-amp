import { AccountStatus, CsrRoleName, CsrStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma.ts";
import { hashPassword } from "../src/lib/csr/password.ts";

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
      };
    }),
  );
  await prisma.user.createMany({ data: users });
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
