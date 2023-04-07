-- CreateTable
CREATE TABLE "FeatureFetcher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "placementId" TEXT NOT NULL,

    CONSTRAINT "FeatureFetcher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFetcherInfo" (
    "id" TEXT NOT NULL,
    "featureFetcherId" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFetcherInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureFetcher_updatedAt_idx" ON "FeatureFetcher"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFetcher_placementId_name_key" ON "FeatureFetcher"("placementId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFetcherInfo_featureFetcherId_key" ON "FeatureFetcherInfo"("featureFetcherId");

-- CreateIndex
CREATE INDEX "FeatureFetcherInfo_updatedAt_idx" ON "FeatureFetcherInfo"("updatedAt");

-- AddForeignKey
ALTER TABLE "FeatureFetcher" ADD CONSTRAINT "FeatureFetcher_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFetcherInfo" ADD CONSTRAINT "FeatureFetcherInfo_featureFetcherId_fkey" FOREIGN KEY ("featureFetcherId") REFERENCES "FeatureFetcher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
