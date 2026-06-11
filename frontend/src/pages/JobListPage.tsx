import { Link } from "react-router-dom";
import { IconTrash } from "../components/Icons";
import { useJobs } from "../hooks/useJobs";
import { formatDt } from "../utils/format";

export default function JobListPage() {
  const {
    jobs,
    loading,
    error,
    submitting,
    page,
    totalPages,
    hasActiveFilters,
    deletingId,
    draftKeyword,
    setDraftKeyword,
    draftCreatedFrom,
    setDraftCreatedFrom,
    draftCreatedTo,
    setDraftCreatedTo,
    applyFilters,
    clearFilters,
    title,
    setTitle,
    location,
    setLocation,
    description,
    setDescription,
    createJob,
    deleteJob,
    setPage,
  } = useJobs();

  return (
    <>
      <h1>Your jobs</h1>

      <section>
        <h2>Post a job</h2>
        {error ? <p className="error">{error}</p> : null}
        <form className="form-grid" onSubmit={(e) => void createJob(e)}>
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
        <div className="job-filters">
          <div className="form-grid job-filters-grid">
            <label>
              Keyword
              <input
                type="search"
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                placeholder="Title, location, or description"
                maxLength={200}
              />
            </label>
            <label>
              Created from
              <input
                type="date"
                value={draftCreatedFrom}
                onChange={(e) => setDraftCreatedFrom(e.target.value)}
              />
            </label>
            <label>
              Created to
              <input
                type="date"
                value={draftCreatedTo}
                onChange={(e) => setDraftCreatedTo(e.target.value)}
              />
            </label>
          </div>
          <div className="job-filters-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={applyFilters}
            >
              Apply filters
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>
        {loading ? (
          <p className="loading">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <p className="empty">
            {hasActiveFilters
              ? "No jobs match your filters."
              : "No jobs yet. Post one above."}
          </p>
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
                    onClick={() => void deleteJob(job)}
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
