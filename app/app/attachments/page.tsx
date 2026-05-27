import { resolveProjectId } from "@/lib/app-data";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { AttachmentsClient } from "@/components/app/attachments-client";

export const metadata = { title: "Attachments" };

export default async function AttachmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);

  return (
    <div>
      <ProjectViewHeader current="attachments" projectId={pid} />
      <AttachmentsClient key={pid} projectId={pid} />
    </div>
  );
}
