ALTER TABLE "Purchase" ADD COLUMN "vehicleId" TEXT;

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Purchase_vehicleId_idx" ON "Purchase"("vehicleId");
