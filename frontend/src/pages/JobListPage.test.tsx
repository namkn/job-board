import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteJson, getJson, postJson } from "../api";
import type { Job } from "../types/job";
import type { PageResult } from "../types/pagination";
import JobListPage from "./JobListPage";

vi.mock("../api", () => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
  deleteJson: vi.fn(),
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
    viewCount: 12,
    applicationCount: 3,
    ...overrides,
  };
}

function pageResult(
  items: Job[],
  opts: { page?: number; totalPages?: number; total?: number } = {},
): PageResult<Job> {
  return {
    items,
    page: opts.page ?? 1,
    pageSize: 5,
    total: opts.total ?? items.length,
    totalPages: opts.totalPages ?? 1,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <JobListPage />
    </MemoryRouter>,
  );
}

describe("JobListPage", () => {
  beforeEach(() => {
    vi.mocked(getJson).mockReset();
    vi.mocked(postJson).mockReset();
    vi.mocked(deleteJson).mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    cleanup();
  });

  it("loads and displays jobs from the API", async () => {
    vi.mocked(getJson).mockResolvedValue(pageResult([mockJob()]));

    renderPage();

    expect(screen.getByText("Loading jobs…")).toBeInTheDocument();

    expect(await screen.findByRole("link", { name: "Backend Engineer" }))
      .toBeInTheDocument();
    expect(screen.getByText("Acme Corp · Remote")).toBeInTheDocument();
    expect(screen.getByText("Build APIs")).toBeInTheDocument();

    expect(getJson).toHaveBeenCalledWith(
      "/jobs?page=1&pageSize=5&sort=createdDesc",
    );
  });

  it("shows empty state when there are no jobs", async () => {
    vi.mocked(getJson).mockResolvedValue(pageResult([]));

    renderPage();

    expect(
      await screen.findByText("No jobs yet. Post one above."),
    ).toBeInTheDocument();
  });

  it("resets sort to date created when filters are cleared", async () => {
    vi.mocked(getJson).mockResolvedValue(pageResult([mockJob()]));

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("link", { name: "Backend Engineer" });

    await user.selectOptions(screen.getByLabelText("Sort by"), "viewCountDesc");
    await user.type(screen.getByPlaceholderText("Title, location, or description"), "foo");
    await user.click(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() => {
      expect(getJson).toHaveBeenLastCalledWith(
        "/jobs?page=1&pageSize=5&sort=createdDesc",
      );
    });
    expect(screen.getByLabelText("Sort by")).toHaveValue("createdDesc");
  });

  it("reloads with sort when sort changes", async () => {
    vi.mocked(getJson).mockResolvedValue(pageResult([mockJob()]));

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("link", { name: "Backend Engineer" });

    await user.selectOptions(screen.getByLabelText("Sort by"), "viewCountDesc");

    await waitFor(() => {
      expect(getJson).toHaveBeenLastCalledWith(
        "/jobs?page=1&pageSize=5&sort=viewCountDesc",
      );
    });

    await user.selectOptions(
      screen.getByLabelText("Sort by"),
      "createdDesc",
    );

    await waitFor(() => {
      expect(getJson).toHaveBeenLastCalledWith(
        "/jobs?page=1&pageSize=5&sort=createdDesc",
      );
    });
  });

  it("shows filtered empty state when filters match nothing", async () => {
    vi.mocked(getJson).mockResolvedValue(pageResult([]));

    const user = userEvent.setup();
    renderPage();

    await screen.findByText("No jobs yet. Post one above.");

    await user.type(screen.getByPlaceholderText("Title, location, or description"), "xyz");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => {
      expect(getJson).toHaveBeenLastCalledWith(
        "/jobs?page=1&pageSize=5&q=xyz&sort=createdDesc",
      );
    });
    expect(
      await screen.findByText("No jobs match your filters."),
    ).toBeInTheDocument();
  });

  it("posts a new job and reloads the list", async () => {
    vi.mocked(getJson)
      .mockResolvedValueOnce(pageResult([]))
      .mockResolvedValueOnce(pageResult([mockJob({ title: "New Role" })]));

    vi.mocked(postJson).mockResolvedValue(
      mockJob({ id: "job-new", title: "New Role" }),
    );

    const user = userEvent.setup();
    renderPage();

    await screen.findByText("No jobs yet. Post one above.");

    await user.type(screen.getByLabelText("Title"), "New Role");
    await user.type(screen.getByLabelText("Location"), "NYC");
    await user.type(screen.getByLabelText("Description"), "Great team");
    await user.click(screen.getByRole("button", { name: "Post job" }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith("/jobs", {
        title: "New Role",
        location: "NYC",
        description: "Great team",
      });
    });

    expect(await screen.findByRole("link", { name: "New Role" }))
      .toBeInTheDocument();
    expect(getJson).toHaveBeenCalledTimes(2);
  });

  it("deletes a job when the user confirms", async () => {
    const job = mockJob();
    vi.mocked(getJson)
      .mockResolvedValueOnce(pageResult([job]))
      .mockResolvedValueOnce(pageResult([]));
    vi.mocked(deleteJson).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("link", { name: "Backend Engineer" });

    await user.click(screen.getByRole("button", { name: "Delete job: Backend Engineer" }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Delete “Backend Engineer”? This cannot be undone.',
    );
    await waitFor(() => {
      expect(deleteJson).toHaveBeenCalledWith("/jobs/job-1");
    });
    expect(
      await screen.findByText("No jobs yet. Post one above."),
    ).toBeInTheDocument();
  });

  it("does not delete when the user cancels the confirm dialog", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.mocked(getJson).mockResolvedValue(pageResult([mockJob()]));

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("link", { name: "Backend Engineer" });
    await user.click(screen.getByRole("button", { name: "Delete job: Backend Engineer" }));

    expect(deleteJson).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Backend Engineer" })).toBeInTheDocument();
  });

  it("paginates to the next page", async () => {
    vi.mocked(getJson)
      .mockResolvedValueOnce(
        pageResult([mockJob({ id: "job-a", title: "Job A" })], {
          page: 1,
          totalPages: 2,
          total: 6,
        }),
      )
      .mockResolvedValueOnce(
        pageResult([mockJob({ id: "job-b", title: "Job B" })], {
          page: 2,
          totalPages: 2,
          total: 6,
        }),
      );

    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("link", { name: "Job A" });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(getJson).toHaveBeenLastCalledWith(
        "/jobs?page=2&pageSize=5&sort=createdDesc",
      );
    });
    expect(await screen.findByRole("link", { name: "Job B" }))
      .toBeInTheDocument();
  });

  it("clears filters and refetches without query params", async () => {
    vi.mocked(getJson).mockResolvedValue(pageResult([]));

    const user = userEvent.setup();
    renderPage();

    await screen.findByText("No jobs yet. Post one above.");

    await user.type(screen.getByPlaceholderText("Title, location, or description"), "foo");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => {
      expect(getJson).toHaveBeenLastCalledWith(
        "/jobs?page=1&pageSize=5&q=foo&sort=createdDesc",
      );
    });

    await user.click(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() => {
      expect(getJson).toHaveBeenLastCalledWith(
        "/jobs?page=1&pageSize=5&sort=createdDesc",
      );
    });
    expect(screen.getByPlaceholderText("Title, location, or description")).toHaveValue("");
  });
});
