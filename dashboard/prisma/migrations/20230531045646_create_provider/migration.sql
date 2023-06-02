/*
  Warnings:

  - You are about to drop the column `serviceConfigId` on the `Cube` table. All the data in the column will be lost.
  - You are about to drop the column `placementId` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `cubeId` on the `Placement` table. All the data in the column will be lost.
  - You are about to drop the `IntegrationInfo` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[providerId,name]` on the table `Cube` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serviceId,providerId,name]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `Cube` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `Integration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `Integration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cube" DROP CONSTRAINT "Cube_serviceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "Integration" DROP CONSTRAINT "Integration_placementId_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationInfo" DROP CONSTRAINT "IntegrationInfo_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "Placement" DROP CONSTRAINT "Placement_cubeId_fkey";

-- DropIndex
DROP INDEX "Cube_serviceConfigId_name_key";

-- DropIndex
DROP INDEX "Integration_placementId_name_key";

-- AlterTable
ALTER TABLE "Cube" DROP COLUMN "serviceConfigId",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Integration" DROP COLUMN "placementId",
DROP COLUMN "type",
ADD COLUMN     "contentTypeId" TEXT,
ADD COLUMN     "details" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "serviceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Placement" DROP COLUMN "cubeId";

-- DropTable
DROP TABLE "IntegrationInfo";

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provide" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IntegrationToPlacement" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Provider_updatedAt_idx" ON "Provider"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_serviceId_provide_name_key" ON "Provider"("serviceId", "provide", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_IntegrationToPlacement_AB_unique" ON "_IntegrationToPlacement"("A", "B");

-- CreateIndex
CREATE INDEX "_IntegrationToPlacement_B_index" ON "_IntegrationToPlacement"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Cube_providerId_name_key" ON "Cube"("providerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_serviceId_providerId_name_key" ON "Integration"("serviceId", "providerId", "name");

-- AddForeignKey
ALTER TABLE "Cube" ADD CONSTRAINT "Cube_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "ContentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationToPlacement" ADD CONSTRAINT "_IntegrationToPlacement_A_fkey" FOREIGN KEY ("A") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IntegrationToPlacement" ADD CONSTRAINT "_IntegrationToPlacement_B_fkey" FOREIGN KEY ("B") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
