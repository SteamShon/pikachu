-- CreateTable
CREATE TABLE "CubeHistory" (
    "id" TEXT NOT NULL,
    "cubeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CubeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeature" (
    "cubeHistoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" JSONB,

    CONSTRAINT "UserFeature_pkey" PRIMARY KEY ("cubeHistoryId","userId")
) PARTITION BY LIST ("cubeHistoryId");

-- CreateIndex
CREATE INDEX "CubeHistory_updatedAt_idx" ON "CubeHistory"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CubeHistory_cubeId_version_key" ON "CubeHistory"("cubeId", "version" DESC);

-- AddForeignKey
ALTER TABLE "CubeHistory" ADD CONSTRAINT "CubeHistory_cubeId_fkey" FOREIGN KEY ("cubeId") REFERENCES "Cube"("id") ON DELETE CASCADE ON UPDATE CASCADE;
