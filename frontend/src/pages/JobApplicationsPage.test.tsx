import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getJson, patchJson } from "../api";
import type { Application } from "../types/application";
import JobApplicationsPage from "./JobApplicationsPage";

vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api")>();
  return {
    ...actual,
    getJson: vi.fn(),
    patchJson: vi.fn(),
  };
});

vi.mock("../utils/format", () => ({
  formatDt: (iso: string) => `fmt:${iso}`,
}));

function mockApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    jobId: "job-1",
    status: "PENDING",
    resumeUrl: "https://example.com/cv.pdf",
    coverNote: "Interested in the role.",
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
    user: { id: "user-1", email: "alex@example.com", name: "Alex" },
    ...overrides,
  };
}

function renderPage(jobId = "job-1") {
  return render(
    <MemoryRouter initialEntries={[`/employers/jobs/${jobId}/applications`]}>
      <Routes>
        <Route
          path="/employers/jobs/:id/applications"
          element={<JobApplicationsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("JobApplicationsPage", () => {
  beforeEach(() => {
    vi.mocked(getJson).mockReset();
    vi.mocked(patchJson).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("lists applications for a job", async () => {
    vi.mocked(getJson).mockResolvedValue({
      job: { id: "job-1", title: "Backend Engineer" },
      items: [mockApplication()],
    });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: /Applications — Backend Engineer/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("Interested in the role.")).toBeInTheDocument();
  });

  it("updates application status", async () => {
    vi.mocked(getJson).mockResolvedValue({
      job: { id: "job-1", title: "Backend Engineer" },
      items: [mockApplication()],
    });
    vi.mocked(patchJson).mockResolvedValue(
      mockApplication({ status: "SCREENING" }),
    );
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Alex");
    await user.selectOptions(screen.getByRole("combobox"), "SCREENING");

    await waitFor(() => {
      expect(patchJson).toHaveBeenCalledWith(
        "/jobs/job-1/applications/app-1",
        { status: "SCREENING" },
      );
    });
  });

  it("shows not found for missing job", async () => {
    vi.mocked(getJson).mockRejectedValue(
      new ApiError("Job not found", 404, { error: "Job not found" }),
    );

    renderPage();

    expect(await screen.findByRole("heading", { name: "Job not found" }))
      .toBeInTheDocument();
  });
});
