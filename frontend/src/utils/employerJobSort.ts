export const DEFAULT_EMPLOYER_JOB_SORT = "createdDesc" as const;

export const EMPLOYER_JOB_SORTS = [
  DEFAULT_EMPLOYER_JOB_SORT,
  "viewCountDesc",
  "applicationCountDesc",
] as const;

export type EmployerJobSort = (typeof EMPLOYER_JOB_SORTS)[number];

const labels: Record<EmployerJobSort, string> = {
  createdDesc: "Date created (newest first)",
  viewCountDesc: "Most views",
  applicationCountDesc: "Most applications",
};

export function employerJobSortLabel(sort: EmployerJobSort): string {
  return labels[sort];
}
