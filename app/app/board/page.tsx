import { BoardClient } from "@/components/app/board-client";
import { resolveProjectId } from "@/lib/app-data";

export const metadata = { title: "Board" };

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const pid = resolveProjectId((await searchParams).project);
  return <BoardClient key={pid} projectId={pid} />;
}
