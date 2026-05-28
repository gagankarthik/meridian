import { resolveProjectId } from "@/lib/app-data";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { ApprovalsClient } from "@/components/app/approvals-client";

export const metadata = { title: "Review" };

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);

  return (
    <div>
      <ProjectViewHeader current="approvals" projectId={pid} />
      <ApprovalsClient key={pid} projectId={pid} />
    </div>
  );
}
