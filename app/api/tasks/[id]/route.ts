import { deleteItem, getItem, key, putItem, stripKeys } from "@/lib/ddb";
import {
  canWrite,
  eligibleAssigneeIds,
  getProjectRole,
  requireWorkspace,
} from "@/lib/workspace-server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const existing = await getItem(key.task(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  // Per-project gate: viewers (and people with no access) can't edit tasks.
  const pr = await getProjectRole(
    r.ctx.workspaceId,
    String(existing.projectId ?? ""),
    r.ctx.userId,
    r.ctx.role,
  );
  if (!pr || pr === "Viewer") {
    return Response.json(
      { error: "Forbidden — you don't have edit access to this project" },
      { status: 403 },
    );
  }

  const patch = await request.json().catch(() => ({}));
  delete patch.PK;
  delete patch.SK;
  delete patch.id;

  // Defense-in-depth: if the patch changes who's assigned to / reviewing the
  // task, enforce the project's team membership server-side (the UI already
  // restricts the pickers). Off-team ids are stripped silently.
  if (
    "assigneeIds" in patch ||
    "assigneeId" in patch ||
    "reviewerId" in patch
  ) {
    const projectId = String(existing.projectId ?? "");
    const eligible = projectId
      ? await eligibleAssigneeIds(r.ctx.workspaceId, projectId)
      : new Set<string>();

    if ("assigneeIds" in patch || "assigneeId" in patch) {
      const requested: string[] = Array.isArray(patch.assigneeIds)
        ? patch.assigneeIds
        : typeof patch.assigneeId === "string" && patch.assigneeId
          ? [patch.assigneeId]
          : [];
      const assigneeIds = requested.filter(
        (a): a is string => typeof a === "string" && eligible.has(a),
      );
      patch.assigneeIds = assigneeIds;
      patch.assigneeId = assigneeIds[0] ?? "";
    }

    if ("reviewerId" in patch) {
      patch.reviewerId =
        typeof patch.reviewerId === "string" && eligible.has(patch.reviewerId)
          ? patch.reviewerId
          : "";
    }
  }

  const next = { ...existing, ...patch };
  await putItem(next);
  return Response.json({ task: stripKeys(next) });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const existing = await getItem(key.task(r.ctx.workspaceId, id));
  if (existing) {
    const pr = await getProjectRole(
      r.ctx.workspaceId,
      String(existing.projectId ?? ""),
      r.ctx.userId,
      r.ctx.role,
    );
    if (!pr || pr === "Viewer") {
      return Response.json(
        { error: "Forbidden — you don't have edit access to this project" },
        { status: 403 },
      );
    }
  }
  await deleteItem(key.task(r.ctx.workspaceId, id));
  return Response.json({ ok: true });
}
