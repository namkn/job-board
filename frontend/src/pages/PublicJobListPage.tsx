import { Link } from "react-router-dom";
import { usePublicJobs } from "../hooks/usePublicJobs";
import { formatDt } from "../utils/format";

export default function PublicJobListPage() {
  const { jobs, loading, error, page, totalPages, setPage } = usePublicJobs();

  return (
    <div className="app">
      <header className="public-header">
        <h1>Job Board</h1>
        <p className="public-lead">Browse open roles from employers on the platform.</p>
        <Link to="/employers/login" className="public-employer-link">
          Employer sign in
        </Link>
      </header>

      <section>
        <h2>Open positions</h2>
        {error ? <p className="error">{error}</p> : null}
        {loading ? (
          <p className="loading">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <p className="empty">No open positions right now.</p>
        ) : (
          <ul className="job-list">
            {jobs.map((job) => (
              <li key={job.id} className="job-card">
                <h3 className="job-card-title">
                  <Link to={`/jobs/${job.id}`} className="job-title-link">
                    {job.title}
                  </Link>
                </h3>
                <div className="job-meta">
                  {job.organization.name} · {job.location}
                </div>
                <div className="job-times">
                  <span>Posted {formatDt(job.createdAt)}</span>
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
    </div>
  );
}
