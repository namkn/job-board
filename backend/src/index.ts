import "dotenv/config";
import "express-async-errors";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  validateApplicantEmail,
  validateApplicantName,
  validateCoverNote,
  validateResumeUrl,
} from "./applyValidation.js";
import { signEmployerToken } from "./employerToken.js";
import { requireEmployerJwt } from "./requireEmployerJwt.js";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT) || 3000;

function jobIdParam(req: express.Request): string | undefined {
  const p = req.params.id;
  if (typeof p === "string") return p;
  if (Array.isArray(p)) return p[0];
  return undefined;
}

function queryInt(
  req: express.Request,
  key: string,
): number | undefined {
  const raw = (req.query as Record<string, unknown>)[key];
  if (typeof raw === "string") {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    const n = Number.parseInt(raw[0], 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function queryString(req: express.Request, key: string): string | undefined {
  const raw = (req.query as Record<string, unknown>)[key];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return undefined;
}

/** `YYYY-MM-DD` → UTC start of that calendar day */
function parseDateOnlyStartUtc(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `YYYY-MM-DD` → UTC end of that calendar day (inclusive) */
function parseDateOnlyEndUtc(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const jobOrganizationSelect = {
  id: true,
  name: true,
  slug: true,
} as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.post("/auth/employers/signup", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const organizationName =
    typeof body.organizationName === "string"
      ? body.organizationName.trim()
      : "";
  const organizationSlugRaw =
    typeof body.organizationSlug === "string" ? body.organizationSlug : "";

  const organizationSlug = normalizeSlug(organizationSlugRaw);

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  if (!organizationName) {
    res.status(400).json({ error: "Organization name is required" });
    return;
  }
  if (!organizationSlug || !slugPattern.test(organizationSlug)) {
    res
      .status(400)
      .json({
        error:
          "Organization slug must be lowercase letters, numbers, and hyphens only (e.g. acme-inc)",
      });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { user, organization } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: organizationName, slug: organizationSlug },
      });
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
        },
      });
      await tx.organizationMember.create({
        data: {
          userId: createdUser.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });
      return { user: createdUser, organization: org };
    });

    const token = signEmployerToken({
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const raw = e.meta?.target;
      const target = Array.isArray(raw)
        ? raw.join(" ")
        : typeof raw === "string"
          ? raw
          : "";
      if (target.includes("email")) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }
      if (target.includes("slug")) {
        res.status(409).json({ error: "This organization slug is already taken" });
        return;
      }
      res.status(409).json({ error: "Email or organization slug already in use" });
      return;
    }
    res.status(500).json({ error: "Failed to sign up" });
  }
});

app.post("/auth/employers/login", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user?.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const membership =
      user.memberships.find((m) => m.role === "OWNER") ?? user.memberships[0];
    if (!membership) {
      res.status(403).json({ error: "No organization membership for this account" });
      return;
    }

    const token = signEmployerToken({
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: membership.organizationId },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to log in" });
  }
});

const publishedJobFilter = { status: "PUBLISHED" as const };

app.get("/public/jobs", async (req, res) => {
  const page = Math.max(1, queryInt(req, "page") ?? 1);
  const pageSizeRaw = queryInt(req, "pageSize") ?? 10;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));
  const skip = (page - 1) * pageSize;

  try {
    const [total, items] = await prisma.$transaction([
      prisma.job.count({ where: publishedJobFilter }),
      prisma.job.findMany({
        where: publishedJobFilter,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { organization: { select: jobOrganizationSelect } },
      }),
    ]);

    res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.get("/public/jobs/:id", async (req, res) => {
  const id = jobIdParam(req);
  if (!id) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }
  try {
    const job = await prisma.job.findFirst({
      where: { id, ...publishedJobFilter },
      include: { organization: { select: jobOrganizationSelect } },
    });
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  } catch {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

app.post("/public/jobs/:id/applications", async (req, res) => {
  const jobId = jobIdParam(req);
  if (!jobId) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name : "";
  const email = typeof body.email === "string" ? body.email : "";
  const resumeUrl = typeof body.resumeUrl === "string" ? body.resumeUrl : "";
  const coverNoteRaw = typeof body.coverNote === "string" ? body.coverNote : "";

  const validationError =
    validateApplicantName(name) ??
    validateApplicantEmail(email) ??
    validateResumeUrl(resumeUrl) ??
    validateCoverNote(coverNoteRaw);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedResumeUrl = resumeUrl.trim();
  const coverNote = coverNoteRaw.trim() || null;

  try {
    const job = await prisma.job.findFirst({
      where: { id: jobId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const application = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: trimmedEmail } });
      if (user) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { name: trimmedName },
        });
      } else {
        user = await tx.user.create({
          data: {
            email: trimmedEmail,
            name: trimmedName,
            passwordHash: null,
          },
        });
      }

      await tx.candidateProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      return tx.application.create({
        data: {
          jobId,
          userId: user.id,
          resumeUrl: trimmedResumeUrl,
          coverNote,
        },
      });
    });

    res.status(201).json({
      id: application.id,
      jobId: application.jobId,
      status: application.status,
      createdAt: application.createdAt,
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      res.status(409).json({
        error: "You have already applied to this job with this email",
      });
      return;
    }
    res.status(500).json({ error: "Failed to submit application" });
  }
});

app.get("/jobs", requireEmployerJwt, async (req, res) => {
  const organizationId = req.employer!.organizationId;
  const page = Math.max(1, queryInt(req, "page") ?? 1);
  const pageSizeRaw = queryInt(req, "pageSize") ?? 5;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));
  const skip = (page - 1) * pageSize;

  const qRaw = queryString(req, "q");
  const q = qRaw?.trim().slice(0, 200) ?? "";
  const createdFromRaw = queryString(req, "createdFrom")?.trim() ?? "";
  const createdToRaw = queryString(req, "createdTo")?.trim() ?? "";

  const createdFrom = createdFromRaw
    ? parseDateOnlyStartUtc(createdFromRaw)
    : null;
  const createdTo = createdToRaw ? parseDateOnlyEndUtc(createdToRaw) : null;

  if (createdFromRaw && !createdFrom) {
    res.status(400).json({ error: "createdFrom must be YYYY-MM-DD" });
    return;
  }
  if (createdToRaw && !createdTo) {
    res.status(400).json({ error: "createdTo must be YYYY-MM-DD" });
    return;
  }
  if (createdFrom && createdTo && createdFrom.getTime() > createdTo.getTime()) {
    res.status(400).json({ error: "createdFrom must be on or before createdTo" });
    return;
  }

  const where: Prisma.JobWhereInput = { organizationId };
  const and: Prisma.JobWhereInput[] = [];

  if (q.length > 0) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (createdFrom) {
    and.push({ createdAt: { gte: createdFrom } });
  }
  if (createdTo) {
    and.push({ createdAt: { lte: createdTo } });
  }
  if (and.length > 0) {
    where.AND = and;
  }

  try {
    const [total, items] = await prisma.$transaction([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { organization: { select: jobOrganizationSelect } },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    res.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.get("/jobs/:id", requireEmployerJwt, async (req, res) => {
  const id = jobIdParam(req);
  const organizationId = req.employer!.organizationId;
  if (!id) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }
  try {
    const job = await prisma.job.findFirst({
      where: { id, organizationId },
      include: { organization: { select: jobOrganizationSelect } },
    });
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  } catch {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

app.post("/jobs", requireEmployerJwt, async (req, res) => {
  const organizationId = req.employer!.organizationId;
  const { title, location, description } = req.body as Record<string, unknown>;

  if (
    typeof title !== "string" ||
    typeof location !== "string" ||
    typeof description !== "string"
  ) {
    res.status(400).json({
      error:
        "Expected JSON body with title, location, description (all strings)",
    });
    return;
  }

  const trimmed = {
    title: title.trim(),
    location: location.trim(),
    description: description.trim(),
  };

  if (!trimmed.title || !trimmed.location || !trimmed.description) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const job = await prisma.job.create({
      data: {
        organizationId,
        title: trimmed.title,
        location: trimmed.location,
        description: trimmed.description,
        status: "PUBLISHED",
      },
      include: { organization: { select: jobOrganizationSelect } },
    });
    res.status(201).json(job);
  } catch {
    res.status(500).json({ error: "Failed to create job" });
  }
});

app.patch("/jobs/:id", requireEmployerJwt, async (req, res) => {
  const id = jobIdParam(req);
  const organizationId = req.employer!.organizationId;
  if (!id) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }

  const { title, location, description } = req.body as Record<string, unknown>;

  if (
    typeof title !== "string" ||
    typeof location !== "string" ||
    typeof description !== "string"
  ) {
    res.status(400).json({
      error:
        "Expected JSON body with title, location, description (all strings)",
    });
    return;
  }

  const trimmed = {
    title: title.trim(),
    location: location.trim(),
    description: description.trim(),
  };

  if (!trimmed.title || !trimmed.location || !trimmed.description) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const existing = await prisma.job.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        title: trimmed.title,
        location: trimmed.location,
        description: trimmed.description,
      },
      include: { organization: { select: jobOrganizationSelect } },
    });
    res.json(job);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update job" });
  }
});

app.delete("/jobs/:id", requireEmployerJwt, async (req, res) => {
  const id = jobIdParam(req);
  const organizationId = req.employer!.organizationId;
  if (!id) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }

  try {
    const deleted = await prisma.job.deleteMany({
      where: { id, organizationId },
    });
    if (deleted.count === 0) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Failed to delete job" });
  }
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
