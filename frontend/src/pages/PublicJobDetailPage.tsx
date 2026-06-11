import { Link, useParams } from "react-router-dom";
import { usePublicJob } from "../hooks/usePublicJob";
import { formatDt } from "../utils/format";

export default function PublicJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    job,
    loading,
    notFound,
    error,
    name,
    setName,
    email,
    setEmail,
    resumeUrl,
    setResumeUrl,
    coverNote,
    setCoverNote,
    submitting,
    submitted,
    submitApplication,
  } = usePublicJob(id);

  return (
    <div className="app">
      <nav className="detail-nav">
        <Link to="/jobs" className="back-link">
          ← All jobs
        </Link>
      </nav>

      {loading ? (
        <p className="loading">Loading job…</p>
      ) : notFound ? (
        <section className="detail-panel">
          <h1>Job not found</h1>
          <p className="empty">This job may have been removed or is no longer open.</p>
          <Link to="/jobs">Back to job board</Link>
        </section>
      ) : error && !job ? (
        <section className="detail-panel">
          <p className="error">{error}</p>
        </section>
      ) : job ? (
        <>
          <section className="detail-panel">
            <h1 className="detail-title">{job.title}</h1>
            <div className="job-meta detail-meta">
              {job.organization.name} · {job.location}
            </div>
            <div className="job-times">
              <span>Posted {formatDt(job.createdAt)}</span>
            </div>
            <p className="job-desc detail-description">{job.description}</p>
          </section>

          <section>
            <h2>Apply for this role</h2>
            {submitted ? (
              <p className="success">
                Application submitted. The employer will review your materials.
              </p>
            ) : (
              <>
                {error ? <p className="error">{error}</p> : null}
                <p className="field-hint apply-intro">
                  A <strong>cover note</strong> is a short message to the employer
                  — why you are interested or what you would bring to the role.
                  Your <strong>resume URL</strong> should be a public link (e.g.
                  LinkedIn or a hosted PDF).
                </p>
                <form
                  className="form-grid"
                  onSubmit={(e) => void submitApplication(e)}
                >
                  <label>
                    Your name
                    <input
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={200}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={320}
                    />
                  </label>
                  <label>
                    Resume URL
                    <input
                      type="url"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://…"
                      maxLength={2048}
                    />
                  </label>
                  <label>
                    Cover note{" "}
                    <span className="optional">(optional)</span>
                    <textarea
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      maxLength={5000}
                      rows={4}
                    />
                  </label>
                  <button type="submit" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit application"}
                  </button>
                </form>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
