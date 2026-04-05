import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { getJson, postJson } from "./api";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  postedAt: string;
};

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

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
      await postJson<Job, { title: string; company: string; location: string; description: string }>(
        "/jobs",
        { title, company, location, description },
      );
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
                <h3>{job.title}</h3>
                <div className="job-meta">
                  {job.company} · {job.location} ·{" "}
                  {new Date(job.postedAt).toLocaleString()}
                </div>
                <p className="job-desc">{job.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
