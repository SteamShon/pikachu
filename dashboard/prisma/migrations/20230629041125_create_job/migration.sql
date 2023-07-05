-- DropForeignKey
ALTER TABLE "Placement" DROP CONSTRAINT "Placement_contentTypeId_fkey";

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_integrationId_name_key" ON "Job"("integrationId", "name");

-- CreateIndex
CREATE INDEX "AdSet_updatedAt_idx" ON "AdSet"("updatedAt");

-- CreateIndex
CREATE INDEX "Segment_updatedAt_idx" ON "Segment"("updatedAt");

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "ContentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
