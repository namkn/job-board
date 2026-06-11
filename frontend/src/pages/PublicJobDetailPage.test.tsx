import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getJson, postJson } from "../api";
import type { Job } from "../types/job";
import PublicJobDetailPage from "./PublicJobDetailPage";

vi.mock("../api", () => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(message: string, status: number, body: unknown) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
}));

vi.mock("../utils/format", () => ({
  formatDt: (iso: string) => `fmt:${iso}`,
}));

function mockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    title: "Backend Engineer",
    location: "Remote",
    description: "Build APIs",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    organization: { id: "org-1", name: "Acme Corp", slug: "acme" },
    ...overrides,
  };
}

function renderPage(jobId = "job-1") {
  return render(
    <MemoryRouter initialEntries={[`/jobs/${jobId}`]}>
      <Routes>
        <Route path="/jobs/:id" element={<PublicJobDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicJobDetailPage", () => {
  beforeEach(() => {
    vi.mocked(getJson).mockReset();
    vi.mocked(postJson).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows job details when loaded", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());

    renderPage();

    expect(await screen.findByRole("heading", { name: "Backend Engineer" })).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText("Build APIs")).toBeInTheDocument();
  });

  it("shows not found for 404", async () => {
    vi.mocked(getJson).mockRejectedValue(
      new ApiError("Job not found", 404, { error: "Job not found" }),
    );

    renderPage();

    expect(await screen.findByRole("heading", { name: "Job not found" })).toBeInTheDocument();
  });

  it("validates form before submit", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(postJson).not.toHaveBeenCalled();
  });

  it("submits application successfully", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());
    vi.mocked(postJson).mockResolvedValue({
      id: "app-1",
      jobId: "job-1",
      status: "PENDING",
      createdAt: "2026-01-03T00:00:00.000Z",
    });
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.type(screen.getByLabelText(/Your name/i), "Alex");
    await user.type(screen.getByLabelText(/^Email/i), "alex@example.com");
    await user.type(
      screen.getByLabelText(/Resume URL/i),
      "https://example.com/cv.pdf",
    );
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith("/public/jobs/job-1/applications", {
        name: "Alex",
        email: "alex@example.com",
        resumeUrl: "https://example.com/cv.pdf",
        coverNote: "",
      });
    });
    expect(
      screen.getByText(/Application submitted/i),
    ).toBeInTheDocument();
  });

  it("shows duplicate apply error", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());
    vi.mocked(postJson).mockRejectedValue(
      new ApiError(
        "You have already applied to this job with this email",
        409,
        { error: "You have already applied to this job with this email" },
      ),
    );
    const user = userEvent.setup();

    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.type(screen.getByLabelText(/Your name/i), "Alex");
    await user.type(screen.getByLabelText(/^Email/i), "alex@example.com");
    await user.type(
      screen.getByLabelText(/Resume URL/i),
      "https://example.com/cv.pdf",
    );
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    expect(
      await screen.findByText(/already applied/i),
    ).toBeInTheDocument();
  });
});
