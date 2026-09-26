CREATE TYPE "CallStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE "Call" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "csrId" TEXT NOT NULL,
  "status" "CallStatus" NOT NULL DEFAULT 'OPEN',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),

  CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Call_reference_key" ON "Call"("reference");
CREATE INDEX "Call_csrId_status_idx" ON "Call"("csrId", "status");
CREATE INDEX "Call_startedAt_idx" ON "Call"("startedAt");
CREATE UNIQUE INDEX "Call_one_open_per_csr" ON "Call"("csrId") WHERE "status" = 'OPEN';

ALTER TABLE "Call" ADD CONSTRAINT "Call_csrId_fkey" FOREIGN KEY ("csrId") REFERENCES "Csr"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CustomerEvent" ADD COLUMN "csrId" TEXT;
ALTER TABLE "CustomerEvent" ADD COLUMN "callId" TEXT;

CREATE INDEX "CustomerEvent_callId_idx" ON "CustomerEvent"("callId");
CREATE INDEX "CustomerEvent_csrId_idx" ON "CustomerEvent"("csrId");

ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_csrId_fkey" FOREIGN KEY ("csrId") REFERENCES "Csr"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Call" ENABLE ROW LEVEL SECURITY;
