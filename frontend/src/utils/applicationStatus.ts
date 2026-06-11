import type { ApplicationStatus } from "../types/application";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "PENDING",
  "SCREENING",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
];

const labels: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export function applicationStatusLabel(status: ApplicationStatus): string {
  return labels[status];
}
