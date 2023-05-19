-- CreateTable
CREATE TABLE "CreativeStat" (
    "timeUnit" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "creativeId" TEXT NOT NULL,
    "impressionCount" BIGINT NOT NULL,
    "clickCount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeStat_pkey" PRIMARY KEY ("timeUnit","time","creativeId")
) PARTITION BY RANGE ("timeUnit", "time");
