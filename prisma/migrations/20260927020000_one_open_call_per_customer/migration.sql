CREATE UNIQUE INDEX "Call_one_open_per_customer" ON "Call"("userId") WHERE "status" = 'OPEN' AND "userId" IS NOT NULL;
