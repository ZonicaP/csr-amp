ALTER TYPE "CallStatus" ADD VALUE 'CALLBACK';

ALTER TABLE "Call" ADD COLUMN "gaveReference" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Call" ADD COLUMN "confirmedNothingElse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Call" ADD COLUMN "closingNotes" TEXT;
ALTER TABLE "Call" ADD COLUMN "callbackNote" TEXT;
ALTER TABLE "Call" ADD COLUMN "escalatedAt" TIMESTAMP(3);
ALTER TABLE "Call" ADD COLUMN "escalatedFromCsrId" TEXT;

CREATE INDEX "Call_escalatedFromCsrId_idx" ON "Call"("escalatedFromCsrId");

ALTER TABLE "Call" ADD CONSTRAINT "Call_escalatedFromCsrId_fkey" FOREIGN KEY ("escalatedFromCsrId") REFERENCES "Csr"("id") ON DELETE SET NULL ON UPDATE CASCADE;
