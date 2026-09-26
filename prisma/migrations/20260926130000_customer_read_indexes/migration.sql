-- Customer pages load vehicles, plans, and payments by foreign key.
-- Postgres does not index foreign keys, so those reads were sequential scans.
CREATE INDEX "Vehicle_userId_createdAt_idx" ON "Vehicle"("userId", "createdAt");
CREATE INDEX "Subscription_vehicleId_startedAt_idx" ON "Subscription"("vehicleId", "startedAt");
CREATE INDEX "Purchase_userId_purchasedAt_idx" ON "Purchase"("userId", "purchasedAt");

-- Membership and email checks use LOWER(column) = LOWER($1), which cannot use the unique btree.
CREATE INDEX "User_membershipId_lower_idx" ON "User" (lower("membershipId"));
CREATE INDEX "User_email_lower_idx" ON "User" (lower("email"));
