export type JobOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type Job = {
  id: string;
  title: string;
  location: string;
  description: string;
  viewCount?: number;
  applicationCount?: number;
  createdAt: string;
  updatedAt: string;
  organization: JobOrganization;
};
