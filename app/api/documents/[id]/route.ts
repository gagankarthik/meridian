import { deleteItem, getItem, key, putItem, stripKeys } from "@/lib/ddb";
import { deleteObject } from "@/lib/s3";
import {
  canWrite,
  getProjectRole,
  notifyMembers,
  requireWorkspace,
  resolveMemberId,
} from "@/lib/workspace-server";

/**
 * PATCH a document's review state:
 *   { status: "approved", signature }  → reviewer signs off (typed signature)
 *   { status: "rejected", reason }     → reviewer requests changes with a reason
 *   { status: "pending" }              → uploader re-submits after changes
 *
 * Only the assigned reviewer (or a project Owner/Admin) may approve/reject;
 * only the uploader (or a project Owner/Admin) may re-submit.
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const existing = await getItem(key.document(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const status = body.status;

  const myMemberId = await resolveMemberId(r.ctx.workspaceId, r.ctx.userId);
  const myIds = new Set([r.ctx.userId, myMemberId]);
  const projRole = await getProjectRole(
    r.ctx.workspaceId,
    String(existing.projectId),
    r.ctx.userId,
    r.ctx.role,
  );
  const isProjectAdmin = projRole === "Owner" || projRole === "Admin";
  const isReviewer = myIds.has(String(existing.reviewerId));
  const isUploader = myIds.has(String(existing.uploadedById));

  let patch: Record<string, unknown>;
  if (status === "approved" || status === "rejected") {
    if (!isReviewer && !isProjectAdmin) {
      return Response.json({ error: "Only the reviewer can decide" }, { status: 403 });
    }
    patch = {
      status,
      reviewedById: myMemberId,
      reviewedAt: Date.now(),
      signature: status === "approved" ? String(body.signature ?? "").slice(0, 160) : "",
      rejectReason: status === "rejected" ? String(body.reason ?? "").slice(0, 1000) : "",
    };
  } else if (status === "pending") {
    if (!isUploader && !isProjectAdmin) {
      return Response.json({ error: "Only the uploader can re-submit" }, { status: 403 });
    }
    patch = {
      status: "pending",
      reviewedById: "",
      reviewedAt: 0,
      signature: "",
      rejectReason: "",
    };
  } else {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  const next = { ...existing, ...patch };
  await putItem(next);

  // Notify the relevant party of the outcome (best-effort).
  try {
    if (status === "approved" || status === "rejected") {
      const verb = status === "approved" ? "signed off on" : "requested changes to";
      await notifyMembers(
        r.ctx.workspaceId,
        r.ctx.userId,
        [String(existing.uploadedById)],
        `${verb} your document: ${existing.title}`,
        "",
      );
    } else if (status === "pending") {
      await notifyMembers(
        r.ctx.workspaceId,
        r.ctx.userId,
        [String(existing.reviewerId)],
        `re-submitted a document for review: ${existing.title}`,
        "",
      );
    }
  } catch {
    /* best-effort */
  }

  return Response.json({ document: stripKeys(next) });
}

/** DELETE → remove a document's S3 object + its DynamoDB record. Only the
    uploader or a project Owner/Admin may delete. */
export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const existing = await getItem(key.document(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const myMemberId = await resolveMemberId(r.ctx.workspaceId, r.ctx.userId);
  const myIds = new Set([r.ctx.userId, myMemberId]);
  const projRole = await getProjectRole(
    r.ctx.workspaceId,
    String(existing.projectId),
    r.ctx.userId,
    r.ctx.role,
  );
  const isProjectAdmin = projRole === "Owner" || projRole === "Admin";
  if (!myIds.has(String(existing.uploadedById)) && !isProjectAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const objectKey = existing.objectKey;
  if (typeof objectKey === "string" && objectKey) {
    try {
      await deleteObject(objectKey);
    } catch {
      /* ignore — still drop the record below */
    }
  }
  await deleteItem(key.document(r.ctx.workspaceId, id));
  return Response.json({ ok: true });
}
