-- Resume URL is per application; candidate profile no longer stores it.
ALTER TABLE "CandidateProfile" DROP COLUMN IF EXISTS "resumeUrl";

ALTER TABLE "Application" ADD COLUMN "resumeUrl" TEXT NOT NULL DEFAULT '';

-- Clear placeholder default after backfill (no existing applications expected in dev).
ALTER TABLE "Application" ALTER COLUMN "resumeUrl" DROP DEFAULT;
