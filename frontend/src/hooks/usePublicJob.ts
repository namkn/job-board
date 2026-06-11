import { useCallback, useEffect, useState } from "react";
import { ApiError, getJson, postJson } from "../api";
import type { Job } from "../types/job";
import { validateApplicationForm } from "../utils/applyValidation";

export type ApplicationSubmitResult = {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
};

export function usePublicJob(jobId: string | undefined) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setError(null);
    setNotFound(false);
    setLoading(true);
    try {
      const data = await getJson<Job>(
        `/public/jobs/${encodeURIComponent(jobId)}`,
      );
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
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId) return;

    const validationError = validateApplicationForm({
      name,
      email,
      resumeUrl,
      coverNote,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await postJson<
        ApplicationSubmitResult,
        {
          name: string;
          email: string;
          resumeUrl: string;
          coverNote: string;
        }
      >(`/public/jobs/${encodeURIComponent(jobId)}/applications`, {
        name,
        email,
        resumeUrl,
        coverNote,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  }

  return {
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
  };
}
