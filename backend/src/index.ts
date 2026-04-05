import "dotenv/config";
import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/jobs", async (_req, res) => {
  try {
    const jobs = await prisma.job.findMany({ orderBy: { postedAt: "desc" } });
    res.json(jobs);
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.post("/jobs", async (req, res) => {
  const { title, company, location, description } = req.body as Record<
    string,
    unknown
  >;

  if (
    typeof title !== "string" ||
    typeof company !== "string" ||
    typeof location !== "string" ||
    typeof description !== "string"
  ) {
    res.status(400).json({
      error:
        "Expected JSON body with title, company, location, description (all strings)",
    });
    return;
  }

  const trimmed = {
    title: title.trim(),
    company: company.trim(),
    location: location.trim(),
    description: description.trim(),
  };

  if (
    !trimmed.title ||
    !trimmed.company ||
    !trimmed.location ||
    !trimmed.description
  ) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const job = await prisma.job.create({ data: trimmed });
    res.status(201).json(job);
  } catch {
    res.status(500).json({ error: "Failed to create job" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
