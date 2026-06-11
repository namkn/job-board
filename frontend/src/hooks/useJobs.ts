import { useCallback, useEffect, useState } from "react";
import { deleteJson, getJson, postJson } from "../api";
import type { Job } from "../types/job";
import type { PageResult } from "../types/pagination";
import {
  DEFAULT_EMPLOYER_JOB_SORT,
  type EmployerJobSort,
} from "../utils/employerJobSort";

const DEFAULT_PAGE_SIZE = 5;

export function useJobs(pageSize = DEFAULT_PAGE_SIZE) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [draftKeyword, setDraftKeyword] = useState("");
  const [draftCreatedFrom, setDraftCreatedFrom] = useState("");
  const [draftCreatedTo, setDraftCreatedTo] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedCreatedFrom, setAppliedCreatedFrom] = useState("");
  const [appliedCreatedTo, setAppliedCreatedTo] = useState("");
  const [sort, setSort] = useState<EmployerJobSort>(DEFAULT_EMPLOYER_JOB_SORT);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const jobsQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const kw = appliedKeyword.trim();
    if (kw) params.set("q", kw);
    if (appliedCreatedFrom) params.set("createdFrom", appliedCreatedFrom);
    if (appliedCreatedTo) params.set("createdTo", appliedCreatedTo);
    params.set("sort", sort);
    return params.toString();
  }, [
    page,
    pageSize,
    appliedKeyword,
    appliedCreatedFrom,
    appliedCreatedTo,
    sort,
  ]);

  const loadJobs = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getJson<PageResult<Job>>(
        `/jobs?${jobsQueryString()}`,
      );
      setJobs(data.items);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [jobsQueryString]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const hasActiveFilters =
    appliedKeyword.trim().length > 0 ||
    appliedCreatedFrom.length > 0 ||
    appliedCreatedTo.length > 0;

  function applyFilters() {
    setAppliedKeyword(draftKeyword.trim());
    setAppliedCreatedFrom(draftCreatedFrom);
    setAppliedCreatedTo(draftCreatedTo);
    setPage(1);
  }

  function clearFilters() {
    setDraftKeyword("");
    setDraftCreatedFrom("");
    setDraftCreatedTo("");
    setAppliedKeyword("");
    setAppliedCreatedFrom("");
    setAppliedCreatedTo("");
    setSort(DEFAULT_EMPLOYER_JOB_SORT);
    setPage(1);
  }

  function changeSort(next: EmployerJobSort) {
    setSort(next);
    setPage(1);
  }

  async function createJob(e: React.FormEvent) {
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

  async function deleteJob(job: Job) {
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

  return {
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
    sort,
    changeSort,
  };
}
