-- Five sample jobs for employer org d6675cc5-deb0-4802-b168-ce865b2b8f6e
-- (User c9f9b240-39f0-4594-8eec-4927d3737613 is not stored on Job; scope is via organization.)
-- Run: psql "$DATABASE_URL" -f scripts/seed-five-jobs.sql
-- Or: docker compose exec -T postgres psql -U jobboard -d jobboard < scripts/seed-five-jobs.sql

INSERT INTO "Job" ("id", "organizationId", "title", "location", "description", "status", "createdAt", "updatedAt")
VALUES
  (
    gen_random_uuid(),
    'd6675cc5-deb0-4802-b168-ce865b2b8f6e',
    'Senior Backend Engineer',
    'Remote (US)',
    'Design and ship APIs in TypeScript and Node. Experience with PostgreSQL and Prisma preferred. You will own services end-to-end and collaborate with product on scope and tradeoffs.',
    'PUBLISHED',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'd6675cc5-deb0-4802-b168-ce865b2b8f6e',
    'Product Designer',
    'Hybrid — Austin, TX',
    'Craft flows and visuals for a two-sided marketplace. Strong Figma skills, systems thinking, and willingness to work closely with engineering on feasibility.',
    'PUBLISHED',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'd6675cc5-deb0-4802-b168-ce865b2b8f6e',
    'DevOps Engineer (Contract)',
    'Remote (EU)',
    'Three-month contract to harden CI/CD, Docker Compose → production path, and observability (logs, metrics, alerts). Prior experience with GitHub Actions and AWS or GCP.',
    'PUBLISHED',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'd6675cc5-deb0-4802-b168-ce865b2b8f6e',
    'Frontend Engineer — React',
    'Toronto, ON',
    'Build accessible, performant UIs in React + TypeScript. Experience with Vite, React Router, and pragmatic testing (Vitest or RTL) is a plus.',
    'PUBLISHED',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'd6675cc5-deb0-4802-b168-ce865b2b8f6e',
    'Technical Writer',
    'Remote',
    'Own developer docs, API reference, and onboarding guides. Comfortable reading OpenAPI specs and working from source-of-truth in the repo.',
    'DRAFT',
    NOW(),
    NOW()
  );
