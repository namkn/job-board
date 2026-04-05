import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, getJson, patchJson } from "../api";
import type { Job } from "../types/job";
import { formatDt } from "../utils/format";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadJob = useCallback(async () => {
    if (!id) return;
    setError(null);
    setNotFound(false);
    setLoading(true);
    try {
      const data = await getJson<Job>(`/jobs/${encodeURIComponent(id)}`);
      setJob(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setNotFound(true);
        setJob(null);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load job");
        setJob(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  function beginEdit() {
    if (!job) return;
    setEditTitle(job.title);
    setEditCompany(job.company);
    setEditLocation(job.location);
    setEditDescription(job.description);
    setEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patchJson<
        Job,
        { title: string; company: string; location: string; description: string }
      >(`/jobs/${encodeURIComponent(id)}`, {
        title: editTitle,
        company: editCompany,
        location: editLocation,
        description: editDescription,
      });
      setJob(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update job");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app">
      <nav className="detail-nav">
        <Link to="/" className="back-link">
          ← All jobs
        </Link>
      </nav>

      {loading ? (
        <p className="loading">Loading job…</p>
      ) : notFound ? (
        <section className="detail-panel">
          <h1>Job not found</h1>
          <p className="empty">This job may have been removed.</p>
          <Link to="/">Back to job board</Link>
        </section>
      ) : error && !job ? (
        <section className="detail-panel">
          <p className="error">{error}</p>
          <button type="button" className="btn-secondary" onClick={() => void loadJob()}>
            Retry
          </button>
        </section>
      ) : job ? (
        <section className="detail-panel">
          {editing ? (
            <>
              <h1 className="detail-heading">Edit job</h1>
              {error ? <p className="error">{error}</p> : null}
              <form className="form-grid" onSubmit={handleSave}>
                <label>
                  Title
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    maxLength={200}
                  />
                </label>
                <label>
                  Company
                  <input
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    required
                    maxLength={200}
                  />
                </label>
                <label>
                  Location
                  <input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    required
                    maxLength={200}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                  />
                </label>
                <div className="job-edit-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={saving}
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="detail-header">
                <h1 className="detail-title">{job.title}</h1>
                <button type="button" className="btn-edit" onClick={beginEdit}>
                  Edit
                </button>
              </div>
              <div className="job-meta detail-meta">
                {job.company} · {job.location}
              </div>
              <div className="job-times">
                <span>Created {formatDt(job.createdAt)}</span>
                <span>Updated {formatDt(job.updatedAt)}</span>
              </div>
              <p className="job-desc detail-description">{job.description}</p>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
