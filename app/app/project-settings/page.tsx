import { resolveProjectId } from "@/lib/app-data";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { ProjectSettingsClient } from "@/components/app/project-settings-client";

export const metadata = { title: "Settings" };

export default async function ProjectSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);

  return (
    <div>
      <ProjectViewHeader current="settings" projectId={pid} />
      <ProjectSettingsClient projectId={pid} />
    </div>
  );
}
