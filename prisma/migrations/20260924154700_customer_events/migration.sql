CREATE TYPE "CustomerEventType" AS ENUM (
  'ACCOUNT_OPENED',
  'PLAN_STARTED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'ACCOUNT_OVERDUE',
  'PLAN_CANCELLED',
  'ACCOUNT_CANCELLED'
);

CREATE TABLE "CustomerEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "CustomerEventType" NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CustomerEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerEvent_userId_createdAt_idx" ON "CustomerEvent"("userId", "createdAt");

ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerEvent" ENABLE ROW LEVEL SECURITY;
