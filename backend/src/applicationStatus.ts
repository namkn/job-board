export const APPLICATION_STATUSES = [
  "PENDING",
  "SCREENING",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}
