import { key, putItem, queryPartition, stripKeys } from "@/lib/ddb";
import {
  canWrite,
  eligibleAssigneeIds,
  getProjectRole,
  requireWorkspace,
} from "@/lib/workspace-server";

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
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title: string = (body.title ?? "").trim();
  if (!title) return Response.json({ error: "title is required" }, { status: 400 });
  if (!body.projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }

  // Per-project gate: viewers (and people with no access) can't create tasks.
  const pr = await getProjectRole(
    r.ctx.workspaceId,
    String(body.projectId),
    r.ctx.userId,
    r.ctx.role,
  );
  if (!pr || pr === "Viewer") {
    return Response.json(
      { error: "Forbidden — you don't have edit access to this project" },
      { status: 403 },
    );
  }

  // Honor a safe client-provided id so the optimistic id matches the persisted
  // one (otherwise navigating to the just-created task 404s as "Task not found").
  const provided = typeof body.id === "string" ? body.id.trim() : "";
  const id = /^[A-Za-z0-9_-]{1,64}$/.test(provided)
    ? provided
    : `t-${crypto.randomUUID().slice(0, 8)}`;
  const requestedAssigneeIds: string[] =
    Array.isArray(body.assigneeIds) && body.assigneeIds.length
      ? body.assigneeIds
      : body.assigneeId
        ? [body.assigneeId]
        : [];

  // Defense-in-depth: only members on the project's team may be assigned or
  // review the task. Strip off-team ids silently (don't reject the request).
  const eligible = await eligibleAssigneeIds(r.ctx.workspaceId, body.projectId);
  const assigneeIds = requestedAssigneeIds.filter((a) => eligible.has(a));
  const reviewerId =
    typeof body.reviewerId === "string" && eligible.has(body.reviewerId)
      ? body.reviewerId
      : "";
  // The creator is whoever the client says (honoring its optimistic value)
  // when it's a non-empty string, else the authenticated request's user id.
  const createdById =
    typeof body.createdById === "string" && body.createdById.trim()
      ? body.createdById.trim()
      : r.ctx.userId;
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
    createdById,
    startDate: body.startDate ?? "",
    reviewerId,
    description: body.description ?? "",
    subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
    comments: Array.isArray(body.comments) ? body.comments : [],
  };
  await putItem(task);
  return Response.json({ task: stripKeys(task) }, { status: 201 });
}
