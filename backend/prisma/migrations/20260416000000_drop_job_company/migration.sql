-- Company name lives on Organization; Job no longer stores a per-row company string.
ALTER TABLE "Job" DROP COLUMN IF EXISTS "company";
