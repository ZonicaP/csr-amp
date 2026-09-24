import { CsrRoleName, CsrStatus } from "@prisma/client";
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
    return;
  }

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

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
