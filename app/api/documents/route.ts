import { key, putItem, stripKeys } from "@/lib/ddb";
import { presignUpload, s3Configured } from "@/lib/s3";
import {
  canWrite,
  getProjectRole,
  notifyMembers,
  requireWorkspace,
} from "@/lib/workspace-server";

/**
 * Documentation = upload → review → digital sign-off. The file itself goes to
 * S3 (via a presigned PUT, exactly like attachments); a DOC# DynamoDB item
 * records the title, project, reviewer, viewers, and review state.
 *
 * POST → presigned PUT url for a direct browser upload (scoped to the workspace).
 * PUT  → record the uploaded file as a DOC# item (status "pending" review).
 */
export async function POST(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }
  if (!s3Configured) {
    return Response.json({ error: "S3 not configured" }, { status: 501 });
  }

  const body = await request.json().catch(() => ({}));
  const filename: string = body.filename ?? "";
  if (!filename) return Response.json({ error: "filename required" }, { status: 400 });

  const safe = filename.replace(/[^\w.\-]+/g, "_");
  const objectKey = `workspaces/${r.ctx.workspaceId}/documents/${crypto
    .randomUUID()
    .slice(0, 8)}-${safe}`;
  const uploadUrl = await presignUpload(
    objectKey,
    body.contentType ?? "application/octet-stream",
  );
  return Response.json({ uploadUrl, key: objectKey });
}

/** PUT → record an uploaded document (after the S3 PUT) + notify the reviewer. */
export async function PUT(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.key || !body.name) {
    return Response.json({ error: "key and name required" }, { status: 400 });
  }
  const projectId = String(body.projectId ?? "");
  if (!projectId) {
    return Response.json({ error: "projectId required" }, { status: 400 });
  }
  // The object key must live under this workspace's prefix.
  if (!String(body.key).startsWith(`workspaces/${r.ctx.workspaceId}/`)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Defense-in-depth: the uploader must be able to write to the target project
  // (the UI already restricts the picker, but never trust the client).
  const projRole = await getProjectRole(
    r.ctx.workspaceId,
    projectId,
    r.ctx.userId,
    r.ctx.role,
  );
  if (!projRole || projRole === "Viewer") {
    return Response.json({ error: "Forbidden for this project" }, { status: 403 });
  }

  const viewerIds = Array.isArray(body.viewerIds)
    ? body.viewerIds.filter((x: unknown): x is string => typeof x === "string" && Boolean(x))
    : [];
  const id = `doc-${crypto.randomUUID().slice(0, 8)}`;
  const item = {
    ...key.document(r.ctx.workspaceId, id),
    type: "document",
    id,
    title: String(body.title ?? body.name),
    name: String(body.name),
    ext: String(body.ext ?? ""),
    size: String(body.size ?? ""),
    projectId,
    uploadedById: r.ctx.userId,
    reviewerId: String(body.reviewerId ?? ""),
    viewerIds,
    status: "pending" as const,
    date: new Date().toISOString().slice(0, 10),
    objectKey: String(body.key),
    description: String(body.description ?? ""),
    createdAt: Date.now(),
  };
  await putItem(item);

  // Let the reviewer (and viewers) know a document is waiting on them.
  try {
    const recipients = [item.reviewerId, ...viewerIds].filter(Boolean);
    if (recipients.length) {
      await notifyMembers(
        r.ctx.workspaceId,
        r.ctx.userId,
        recipients,
        `shared a document for review: ${item.title}`,
        "",
      );
    }
  } catch {
    /* notifications are best-effort */
  }

  return Response.json({ document: stripKeys(item) }, { status: 201 });
}
