ALTER TABLE "Csr" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Csr" ADD COLUMN "emailVerificationTokenHash" TEXT;

CREATE UNIQUE INDEX "Csr_emailVerificationTokenHash_key" ON "Csr"("emailVerificationTokenHash");
