import { Link, useParams } from "react-router-dom";
import { useJobApplications } from "../hooks/useJobApplications";
import type { ApplicationStatus } from "../types/application";
import {
  APPLICATION_STATUSES,
  applicationStatusLabel,
} from "../utils/applicationStatus";
import { formatDt } from "../utils/format";

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const {
    jobTitle,
    applications,
    loading,
    notFound,
    error,
    updatingId,
    updateStatus,
  } = useJobApplications(id);

  return (
    <div className="app">
      <nav className="detail-nav">
        <Link to={id ? `/employers/jobs/${id}` : "/employers/jobs"} className="back-link">
          ← Back to job
        </Link>
      </nav>

      {loading ? (
        <p className="loading">Loading applications…</p>
      ) : notFound ? (
        <section className="detail-panel">
          <h1>Job not found</h1>
          <p className="empty">This job may have been removed.</p>
          <Link to="/employers/jobs">Back to jobs</Link>
        </section>
      ) : (
        <section>
          <h1 className="applications-title">
            Applications{jobTitle ? ` — ${jobTitle}` : ""}
          </h1>
          {error ? <p className="error">{error}</p> : null}
          {applications.length === 0 ? (
            <p className="empty">No applications yet.</p>
          ) : (
            <ul className="application-list">
              {applications.map((application) => (
                <li key={application.id} className="application-card">
                  <div className="application-card-header">
                    <div>
                      <h2 className="application-name">
                        {application.user.name ?? "Unnamed applicant"}
                      </h2>
                      <p className="application-email">{application.user.email}</p>
                    </div>
                    <label className="application-status-field">
                      Status
                      <select
                        value={application.status}
                        disabled={updatingId === application.id}
                        onChange={(e) =>
                          void updateStatus(
                            application.id,
                            e.target.value as ApplicationStatus,
                          )
                        }
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {applicationStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="application-meta">
                    <span>Applied {formatDt(application.createdAt)}</span>
                  </div>
                  <p className="application-resume">
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View resume
                    </a>
                  </p>
                  {application.coverNote ? (
                    <p className="application-cover">{application.coverNote}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
