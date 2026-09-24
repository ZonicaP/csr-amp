CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Supports the customer list sort: ORDER BY lastName, firstName.
CREATE INDEX "User_lastName_firstName_idx" ON "User" ("lastName", "firstName");

-- ILIKE '%term%' cannot use a btree index. Trigram GIN indexes match the
-- case-insensitive contains search on each field.
CREATE INDEX "User_firstName_trgm_idx" ON "User" USING GIN ("firstName" gin_trgm_ops);
CREATE INDEX "User_lastName_trgm_idx" ON "User" USING GIN ("lastName" gin_trgm_ops);
CREATE INDEX "User_email_trgm_idx" ON "User" USING GIN ("email" gin_trgm_ops);
CREATE INDEX "User_phone_trgm_idx" ON "User" USING GIN ("phone" gin_trgm_ops);
