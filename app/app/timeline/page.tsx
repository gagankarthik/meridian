import { resolveProjectId } from "@/lib/app-data";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { TimelineClient } from "@/components/app/timeline-client";

export const metadata = { title: "Timeline" };

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);
  return (
    <div className="flex h-full flex-col bg-paper">
      <ProjectViewHeader current="timeline" projectId={pid} />
      <div className="min-h-0 flex-1">
        <TimelineClient key={pid} projectId={pid} />
      </div>
    </div>
  );
}
