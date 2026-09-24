ALTER TABLE "User" ADD COLUMN "membershipId" TEXT;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS n
  FROM "User"
)
UPDATE "User" AS customer
SET "membershipId" = 'AMP-' || lpad((10000 + numbered.n)::text, 5, '0')
FROM numbered
WHERE customer.id = numbered.id;

ALTER TABLE "User" ALTER COLUMN "membershipId" SET NOT NULL;
CREATE UNIQUE INDEX "User_membershipId_key" ON "User"("membershipId");

ALTER TABLE "User" ADD COLUMN "membershipIdKey" TEXT
GENERATED ALWAYS AS (regexp_replace(upper("membershipId"), '[^A-Z0-9]', '', 'g')) STORED;

CREATE INDEX "User_membershipId_trgm_idx" ON "User" USING GIN ("membershipId" gin_trgm_ops);
CREATE INDEX "User_membershipIdKey_trgm_idx" ON "User" USING GIN ("membershipIdKey" gin_trgm_ops);
