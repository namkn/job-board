import "dotenv/config";
import cors from "cors";
import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT) || 3000;

/** Until auth + org context exist, new jobs attach to this tenant. */
const defaultOrganizationId =
  process.env.DEFAULT_ORGANIZATION_ID ??
  "00000000-0000-0000-0000-000000000001";

const jobOrganizationSelect = {
  id: true,
  name: true,
  slug: true,
} as const;

app.use(cors());
app.use(express.json());

app.get("/jobs", async (_req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: { organization: { select: jobOrganizationSelect } },
    });
    res.json(jobs);
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.get("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const job = await prisma.job.findUnique({
      where: { id },
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

app.post("/jobs", async (req, res) => {
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
        organizationId: defaultOrganizationId,
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

app.patch("/jobs/:id", async (req, res) => {
  const { id } = req.params;
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

app.delete("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "Missing job id" });
    return;
  }

  try {
    await prisma.job.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete job" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
