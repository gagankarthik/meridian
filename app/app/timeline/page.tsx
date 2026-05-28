import { resolveProjectId } from "@/lib/app-data";
import { TimelineClient } from "@/components/app/timeline-client";

export const metadata = { title: "Timeline" };

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);
  return <TimelineClient key={pid} projectId={pid} />;
}
