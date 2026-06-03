import {
  deleteItem,
  getItem,
  key,
  putItem,
  queryPartition,
  stripKeys,
} from "@/lib/ddb";
import { deleteObject } from "@/lib/s3";
import {
  canWrite,
  eligibleAssigneeIds,
  getProjectRole,
  notifyMembers,
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

  // Notify on the changes that matter to a specific person, scoped to them.
  // Best-effort — a notification failure never blocks the update.
  try {
    const title = String(next.title ?? existing.title ?? "a task");
    const quoted = `"${title}"`;

    // Newly added assignees (people on the new list who weren't on the old one).
    if ("assigneeIds" in patch && Array.isArray(patch.assigneeIds)) {
      const before = new Set(
        Array.isArray(existing.assigneeIds)
          ? (existing.assigneeIds as unknown[]).map(String)
          : [],
      );
      const added = (patch.assigneeIds as string[]).filter(
        (a) => !before.has(String(a)),
      );
      if (added.length) {
        await notifyMembers(
          r.ctx.workspaceId,
          r.ctx.userId,
          added,
          `assigned you to ${quoted}`,
          id,
        );
      }
    }

    // A reviewer newly set / changed, or the task sent into review.
    const reviewer = String(next.reviewerId ?? "");
    const reviewerChanged =
      "reviewerId" in patch &&
      String(patch.reviewerId ?? "") !== String(existing.reviewerId ?? "");
    const sentToReview =
      patch.column === "review" && existing.column !== "review";
    if (reviewer && (reviewerChanged || sentToReview)) {
      await notifyMembers(
        r.ctx.workspaceId,
        r.ctx.userId,
        [reviewer],
        `requested your review on ${quoted}`,
        id,
      );
    }
  } catch (err) {
    console.error("[tasks.PATCH] notify failed", err);
  }

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

  // Cascade: a task's attached documents are deleted with it — both the
  // DynamoDB attachment records and the underlying S3 objects (best-effort, so
  // a missing object or unconfigured S3 never blocks the task deletion).
  try {
    const items = await queryPartition(`WS#${r.ctx.workspaceId}`);
    const docs = items.filter(
      (i) => String(i.SK).startsWith("ATTACH#") && String(i.taskId ?? "") === id,
    );
    for (const d of docs) {
      const objectKey = d.objectKey;
      if (typeof objectKey === "string" && objectKey) {
        try {
          await deleteObject(objectKey);
        } catch {
          /* ignore — still drop the record below */
        }
      }
      await deleteItem(key.attach(r.ctx.workspaceId, String(d.id)));
    }
  } catch {
    /* best-effort cascade — the task itself is already deleted */
  }

  return Response.json({ ok: true });
}
