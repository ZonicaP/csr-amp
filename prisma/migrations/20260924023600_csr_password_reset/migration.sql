ALTER TABLE "Csr" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "Csr" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Csr_passwordResetTokenHash_key" ON "Csr"("passwordResetTokenHash");
