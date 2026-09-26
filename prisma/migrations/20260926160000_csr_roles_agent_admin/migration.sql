DELETE FROM "CsrRole" AS supervisor
WHERE supervisor.role = 'SUPERVISOR'
  AND EXISTS (
    SELECT 1
    FROM "CsrRole" AS agent
    WHERE agent."csrId" = supervisor."csrId"
      AND agent.role = 'AGENT'
  );

UPDATE "CsrRole" SET role = 'AGENT' WHERE role = 'SUPERVISOR';

ALTER TYPE "CsrRoleName" RENAME TO "CsrRoleName_old";
CREATE TYPE "CsrRoleName" AS ENUM ('ADMIN', 'AGENT');
ALTER TABLE "CsrRole" ALTER COLUMN "role" TYPE "CsrRoleName" USING ("role"::text::"CsrRoleName");
DROP TYPE "CsrRoleName_old";
