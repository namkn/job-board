import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, deleteJson, getJson, patchJson } from "../api";
import type { Job } from "../types/job";
import JobDetailPage from "./JobDetailPage";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api")>();
  return {
    ...actual,
    getJson: vi.fn(),
    patchJson: vi.fn(),
    deleteJson: vi.fn(),
  };
});

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
    <MemoryRouter initialEntries={[`/employers/jobs/${jobId}`]}>
      <Routes>
        <Route path="/employers/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("JobDetailPage", () => {
  beforeEach(() => {
    vi.mocked(getJson).mockReset();
    vi.mocked(patchJson).mockReset();
    vi.mocked(deleteJson).mockReset();
    navigateMock.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    cleanup();
  });

  it("loads and displays a job from the API", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());

    renderPage();

    expect(screen.getByText("Loading job…")).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Backend Engineer" }))
      .toBeInTheDocument();
    expect(screen.getByText("Acme Corp · Remote")).toBeInTheDocument();
    expect(screen.getByText("Build APIs")).toBeInTheDocument();
    expect(screen.getByText("Created fmt:2026-01-01T00:00:00.000Z"))
      .toBeInTheDocument();
    expect(screen.getByText("Updated fmt:2026-01-02T00:00:00.000Z"))
      .toBeInTheDocument();

    expect(getJson).toHaveBeenCalledWith("/jobs/job-1");
  });

  it("shows not found when the job returns 404", async () => {
    vi.mocked(getJson).mockRejectedValue(
      new ApiError("Job not found", 404, { error: "Job not found" }),
    );

    renderPage();

    expect(await screen.findByRole("heading", { name: "Job not found" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to job board" }))
      .toHaveAttribute("href", "/employers/jobs");
  });

  it("shows an error with retry when loading fails", async () => {
    vi.mocked(getJson).mockRejectedValue(new Error("Network down"));

    renderPage();

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("retries loading when Retry is clicked", async () => {
    vi.mocked(getJson)
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValueOnce(mockJob());

    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Network down");
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Backend Engineer" }))
      .toBeInTheDocument();
    expect(getJson).toHaveBeenCalledTimes(2);
  });

  it("enters edit mode with fields prefilled from the job", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("heading", { name: "Edit job" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Backend Engineer");
    expect(screen.getByLabelText("Location")).toHaveValue("Remote");
    expect(screen.getByLabelText("Description")).toHaveValue("Build APIs");
  });

  it("saves edits via PATCH and returns to view mode", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());
    vi.mocked(patchJson).mockResolvedValue(
      mockJob({
        title: "Senior Backend Engineer",
        location: "NYC",
        description: "Lead API work",
        updatedAt: "2026-03-01T00:00:00.000Z",
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Senior Backend Engineer");
    await user.clear(screen.getByLabelText("Location"));
    await user.type(screen.getByLabelText("Location"), "NYC");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Lead API work");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(patchJson).toHaveBeenCalledWith("/jobs/job-1", {
        title: "Senior Backend Engineer",
        location: "NYC",
        description: "Lead API work",
      });
    });

    expect(
      await screen.findByRole("heading", { name: "Senior Backend Engineer" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Edit job" })).not.toBeInTheDocument();
  });

  it("cancels edit mode without calling PATCH", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Changed title");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("heading", { name: "Backend Engineer" }))
      .toBeInTheDocument();
    expect(patchJson).not.toHaveBeenCalled();
  });

  it("deletes the job when the user confirms", async () => {
    vi.mocked(getJson).mockResolvedValue(mockJob());
    vi.mocked(deleteJson).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.click(screen.getByRole("button", { name: "Delete job" }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Delete “Backend Engineer”? This cannot be undone.',
    );
    await waitFor(() => {
      expect(deleteJson).toHaveBeenCalledWith("/jobs/job-1");
    });
    expect(navigateMock).toHaveBeenCalledWith("/employers/jobs", { replace: true });
  });

  it("does not delete when the user cancels the confirm dialog", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.mocked(getJson).mockResolvedValue(mockJob());

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    await user.click(screen.getByRole("button", { name: "Delete job" }));

    expect(deleteJson).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Backend Engineer" }))
      .toBeInTheDocument();
  });
});
