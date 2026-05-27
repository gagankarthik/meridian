import { resolveProjectId } from "@/lib/app-data";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { ProjectTeamClient } from "@/components/app/project-team-client";

export const metadata = { title: "Team" };

export default async function ProjectTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);

  return (
    <div>
      <ProjectViewHeader current="team" projectId={pid} />
      <ProjectTeamClient projectId={pid} />
    </div>
  );
}
