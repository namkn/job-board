import type { Prisma } from "@prisma/client";

export const DEFAULT_EMPLOYER_JOB_SORT = "createdDesc" as const;

export const EMPLOYER_JOB_SORTS = [
  DEFAULT_EMPLOYER_JOB_SORT,
  "viewCountDesc",
  "applicationCountDesc",
] as const;

export type EmployerJobSort = (typeof EMPLOYER_JOB_SORTS)[number];

const tieBreak: Prisma.JobOrderByWithRelationInput = { id: "desc" };

export function isEmployerJobSort(value: string): value is EmployerJobSort {
  return (EMPLOYER_JOB_SORTS as readonly string[]).includes(value);
}

export function employerJobOrderBy(
  sort: EmployerJobSort,
): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "viewCountDesc":
      return [{ viewCount: "desc" }, tieBreak];
    case "applicationCountDesc":
      return [{ applications: { _count: "desc" } }, tieBreak];
    case "createdDesc":
      return [{ createdAt: "desc" }, tieBreak];
  }
}
