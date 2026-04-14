-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "resumeUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("userId")
);

-- AlterTable (Job -> tenant-aware)
ALTER TABLE "Job"
    ADD COLUMN "organizationId" TEXT,
    ADD COLUMN "status" "JobStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "coverNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- Indices / Uniques
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");
CREATE UNIQUE INDEX "Application_jobId_userId_key" ON "Application"("jobId", "userId");

CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");
CREATE INDEX "Job_organizationId_idx" ON "Job"("organizationId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Application_userId_idx" ON "Application"("userId");
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");

-- Foreign keys (with cascade behavior to match Prisma schema)
ALTER TABLE "OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CandidateProfile"
    ADD CONSTRAINT "CandidateProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Application"
    ADD CONSTRAINT "Application_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Application"
    ADD CONSTRAINT "Application_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tenant bootstrap + backfill
-- Deterministic IDs so this migration is repeatable.
INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "User" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000002', 'owner@example.com', NULL, 'Default Owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "OrganizationMember" ("id", "userId", "organizationId", "role", "createdAt")
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'OWNER', CURRENT_TIMESTAMP);

UPDATE "Job"
SET "organizationId" = '00000000-0000-0000-0000-000000000001'
WHERE "organizationId" IS NULL;

-- Now enforce NOT NULL + FK
ALTER TABLE "Job" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Job"
    ADD CONSTRAINT "Job_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

