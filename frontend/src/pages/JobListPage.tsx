import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconTrash } from "../components/Icons";
import {
  deleteJson,
  getJson,
  postJson,
} from "../api";
import type { Job } from "../types/job";
import type { PageResult } from "../types/pagination";
import { formatDt } from "../utils/format";

export default function JobListPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getJson<PageResult<Job>>(
        `/jobs?page=${encodeURIComponent(String(page))}&pageSize=5`,
      );
      setJobs(data.items);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [navigate, page]);

  useEffect(() => {
    void loadJobs();
  }, [navigate, loadJobs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await postJson<
        Job,
        { title: string; location: string; description: string }
      >("/jobs", { title, location, description });
      setTitle("");
      setLocation("");
      setDescription("");
      setPage(1);
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create job");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(job: Job) {
    if (
      !window.confirm(
        `Delete “${job.title}”? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    setDeletingId(job.id);
    try {
      await deleteJson(`/jobs/${encodeURIComponent(job.id)}`);
      if (jobs.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete job");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <h1>Your jobs</h1>

      <section>
        <h2>Post a job</h2>
        {error ? <p className="error">{error}</p> : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Posting…" : "Post job"}
          </button>
        </form>
      </section>

      <section>
        <h2>Open positions</h2>
        {loading ? (
          <p className="loading">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <p className="empty">No jobs yet. Post one above.</p>
        ) : (
          <ul className="job-list">
            {jobs.map((job) => (
              <li key={job.id} className="job-card">
                <div className="job-card-header-row">
                  <h3 className="job-card-title">
                    <Link
                      to={`/employers/jobs/${job.id}`}
                      className="job-title-link"
                    >
                      {job.title}
                    </Link>
                  </h3>
                  <button
                    type="button"
                    className="btn-delete"
                    disabled={deletingId === job.id}
                    title="Delete job"
                    aria-label={`Delete job: ${job.title}`}
                    onClick={() => void handleDelete(job)}
                  >
                    <IconTrash className="btn-delete-icon" />
                    Delete
                  </button>
                </div>
                <div className="job-meta">
                  {job.organization.name} · {job.location}
                </div>
                <div className="job-times">
                  <span>Created {formatDt(job.createdAt)}</span>
                  <span>Updated {formatDt(job.updatedAt)}</span>
                </div>
                <p
                  className="job-desc job-desc-preview"
                  title={job.description}
                >
                  {job.description}
                </p>
              </li>
            ))}
          </ul>
        )}

        {!loading && totalPages > 1 ? (
          <div className="pagination">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <span className="pagination-meta">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
