import { resolveProjectId } from "@/lib/app-data";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { OverviewClient } from "@/components/app/overview-client";

export const metadata = { title: "Overview" };

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);

  return (
    <div>
      <ProjectViewHeader current="summary" projectId={pid} />
      <OverviewClient projectId={pid} />
    </div>
  );
}
