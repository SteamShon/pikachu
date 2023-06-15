-- CreateTable
CREATE TABLE "UserFeature" (
    "version" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "UserFeature_pkey" PRIMARY KEY ("version","userId")
) PARTITION BY LIST ("version");
