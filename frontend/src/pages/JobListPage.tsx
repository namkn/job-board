import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconTrash } from "../components/Icons";
import { deleteJson, getJson, postJson } from "../api";
import type { Job } from "../types/job";
import { formatDt } from "../utils/format";

export default function JobListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getJson<Job[]>("/jobs");
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await postJson<
        Job,
        { title: string; company: string; location: string; description: string }
      >("/jobs", { title, company, location, description });
      setTitle("");
      setCompany("");
      setLocation("");
      setDescription("");
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
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete job");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="app">
      <h1>Job Board</h1>

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
            Company
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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
                      to={`/jobs/${job.id}`}
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
                  {job.company} · {job.location}
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
      </section>
    </div>
  );
}
