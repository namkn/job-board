export type ApplicationStatus =
  | "PENDING"
  | "SCREENING"
  | "INTERVIEW"
  | "HIRED"
  | "REJECTED";

export type ApplicationUser = {
  id: string;
  email: string;
  name: string | null;
};

export type Application = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  resumeUrl: string;
  coverNote: string | null;
  createdAt: string;
  updatedAt: string;
  user: ApplicationUser;
};

export type JobApplicationsResponse = {
  job: { id: string; title: string };
  items: Application[];
};
