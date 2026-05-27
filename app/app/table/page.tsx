import { ProjectViewHeader } from "@/components/app/view-tabs";
import { TableClient } from "@/components/app/table-client";
import { resolveProjectId } from "@/lib/app-data";

export const metadata = { title: "Table" };

export default async function TablePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);
  return (
    <div>
      <ProjectViewHeader current="table" projectId={pid} />
      <TableClient key={pid} projectId={pid} />
    </div>
  );
}
