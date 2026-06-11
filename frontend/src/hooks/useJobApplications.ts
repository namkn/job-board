import { useCallback, useEffect, useState } from "react";
import { ApiError, getJson, patchJson } from "../api";
import type {
  Application,
  ApplicationStatus,
  JobApplicationsResponse,
} from "../types/application";

export function useJobApplications(jobId: string | undefined) {
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!jobId) return;
    setError(null);
    setNotFound(false);
    setLoading(true);
    try {
      const data = await getJson<JobApplicationsResponse>(
        `/jobs/${encodeURIComponent(jobId)}/applications`,
      );
      setJobTitle(data.job.title);
      setApplications(data.items);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setNotFound(true);
        setJobTitle(null);
        setApplications([]);
      } else {
        setError(
          e instanceof Error ? e.message : "Failed to load applications",
        );
        setJobTitle(null);
        setApplications([]);
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function updateStatus(
    applicationId: string,
    status: ApplicationStatus,
  ) {
    if (!jobId) return;
    setUpdatingId(applicationId);
    setError(null);
    try {
      const updated = await patchJson<
        Application,
        { status: ApplicationStatus }
      >(
        `/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}`,
        { status },
      );
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? updated : a)),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update application status",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return {
    jobTitle,
    applications,
    loading,
    notFound,
    error,
    updatingId,
    updateStatus,
    reload: loadApplications,
  };
}
