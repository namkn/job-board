-- Rename postedAt -> createdAt; add updatedAt
ALTER TABLE "Job" RENAME COLUMN "postedAt" TO "createdAt";

ALTER TABLE "Job" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Job" SET "updatedAt" = "createdAt";
