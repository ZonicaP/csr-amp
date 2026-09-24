-- CreateEnum
CREATE TYPE "CsrStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "CsrRoleName" AS ENUM ('ADMIN', 'SUPERVISOR', 'AGENT');

-- CreateTable
CREATE TABLE "Csr" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "CsrStatus" NOT NULL DEFAULT 'INVITED',
    "passwordHash" TEXT,
    "inviteTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Csr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsrRole" (
    "csrId" TEXT NOT NULL,
    "role" "CsrRoleName" NOT NULL,

    CONSTRAINT "CsrRole_pkey" PRIMARY KEY ("csrId","role")
);

-- CreateIndex
CREATE UNIQUE INDEX "Csr_email_key" ON "Csr"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Csr_inviteTokenHash_key" ON "Csr"("inviteTokenHash");

-- AddForeignKey
ALTER TABLE "CsrRole" ADD CONSTRAINT "CsrRole_csrId_fkey" FOREIGN KEY ("csrId") REFERENCES "Csr"("id") ON DELETE CASCADE ON UPDATE CASCADE;
