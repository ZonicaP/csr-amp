-- Lets a digit-only search such as 555010 match a stored number like 555-010-39.
ALTER TABLE "User" ADD COLUMN "phoneDigits" TEXT
GENERATED ALWAYS AS (regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g')) STORED;

CREATE INDEX "User_phoneDigits_trgm_idx" ON "User" USING GIN ("phoneDigits" gin_trgm_ops);
