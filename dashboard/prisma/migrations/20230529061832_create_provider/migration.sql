/*
  Warnings:

  - You are about to drop the `IntegrationInfo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IntegrationInfo" DROP CONSTRAINT "IntegrationInfo_integrationId_fkey";

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "details" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Placement" ADD COLUMN     "providerId" TEXT;

-- DropTable
DROP TABLE "IntegrationInfo";

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provide" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Provider_updatedAt_idx" ON "Provider"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_serviceId_provide_name_key" ON "Provider"("serviceId", "provide", "name");

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
