import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api";
import type { Job } from "../types/job";
import type { PageResult } from "../types/pagination";

const DEFAULT_PAGE_SIZE = 10;

export function usePublicJobs(pageSize = DEFAULT_PAGE_SIZE) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadJobs = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getJson<PageResult<Job>>(
        `/public/jobs?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`,
      );
      setJobs(data.items);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    page,
    totalPages,
    setPage,
  };
}
