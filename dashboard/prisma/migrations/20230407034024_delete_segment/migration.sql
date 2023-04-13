/*
  Warnings:

  - You are about to drop the `Segment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Segment" DROP CONSTRAINT "Segment_cubeId_fkey";

-- DropTable
DROP TABLE "Segment";
