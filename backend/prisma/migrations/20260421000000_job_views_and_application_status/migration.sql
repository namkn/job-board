-- Job view counter
ALTER TABLE "Job" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Replace ApplicationStatus enum values (pending, screening, interview, hired, rejected)
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PENDING', 'SCREENING', 'INTERVIEW', 'HIRED', 'REJECTED');

ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING (
  CASE "status"::text
    WHEN 'REVIEWED' THEN 'SCREENING'::"ApplicationStatus_new"
    WHEN 'SHORTLISTED' THEN 'INTERVIEW'::"ApplicationStatus_new"
    ELSE "status"::text::"ApplicationStatus_new"
  END
);

ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "ApplicationStatus";

ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
