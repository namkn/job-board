import { Link } from "react-router-dom";
import { IconEye } from "./IconEye";
import { IconUsers } from "./IconUsers";

type Props = {
  jobId: string;
  viewCount: number;
  applicationCount: number;
};

export function JobStats({ jobId, viewCount, applicationCount }: Props) {
  return (
    <div className="job-stats">
      <span className="job-stat" title="Views">
        <IconEye className="job-stat-icon" />
        {viewCount ?? 0}
      </span>
      <Link
        to={`/employers/jobs/${jobId}/applications`}
        className="job-stat job-stat-link"
        title="Applications"
      >
        <IconUsers className="job-stat-icon" />
        {applicationCount ?? 0}
      </Link>
    </div>
  );
}
