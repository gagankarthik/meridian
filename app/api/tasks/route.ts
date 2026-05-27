import { key, putItem, queryPartition, stripKeys } from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

export async function GET(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project");
  const items = await queryPartition(`WS#${r.ctx.workspaceId}`);
  let tasks = items.filter((i) => String(i.SK).startsWith("TASK#")).map(stripKeys);
  if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
  return Response.json({ tasks });
}

export async function POST(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;

  const body = await request.json().catch(() => ({}));
  const title: string = (body.title ?? "").trim();
  if (!title) return Response.json({ error: "title is required" }, { status: 400 });
  if (!body.projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }

  const id = `t-${crypto.randomUUID().slice(0, 8)}`;
  const assigneeIds: string[] =
    Array.isArray(body.assigneeIds) && body.assigneeIds.length
      ? body.assigneeIds
      : body.assigneeId
        ? [body.assigneeId]
        : [];
  const task = {
    ...key.task(r.ctx.workspaceId, id),
    type: "task",
    id,
    title,
    column: body.column ?? "backlog",
    priority: body.priority ?? "Medium",
    assigneeId: assigneeIds[0] ?? "",
    assigneeIds,
    projectId: body.projectId,
    due: body.due ?? "—",
    tag: body.tag ?? "Task",
    tagColor: body.tagColor ?? "#2563eb",
    startDate: body.startDate ?? "",
    reviewerId: body.reviewerId ?? "",
  };
  await putItem(task);
  return Response.json({ task: stripKeys(task) }, { status: 201 });
}
