import { deleteItem, getItem, key, putItem, stripKeys } from "@/lib/ddb";
import {
  deleteObject,
  presignDownload,
  presignUpload,
  s3Configured,
} from "@/lib/s3";
import { canWrite, requireWorkspace } from "@/lib/workspace-server";

/** POST → presigned PUT url for a direct browser upload, scoped to the workspace. */
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
  const objectKey = `workspaces/${r.ctx.workspaceId}/${body.taskId ?? "general"}/${crypto
    .randomUUID()
    .slice(0, 8)}-${safe}`;
  const uploadUrl = await presignUpload(
    objectKey,
    body.contentType ?? "application/octet-stream",
  );
  return Response.json({ uploadUrl, key: objectKey });
}

/** PUT → record an uploaded file as an attachment item (after the S3 PUT). */
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
  // The object key must live under this workspace's prefix.
  if (!String(body.key).startsWith(`workspaces/${r.ctx.workspaceId}/`)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = `att-${crypto.randomUUID().slice(0, 8)}`;
  const item = {
    ...key.attach(r.ctx.workspaceId, id),
    type: "attachment",
    id,
    name: String(body.name),
    ext: String(body.ext ?? ""),
    size: String(body.size ?? ""),
    uploadedById: r.ctx.userId,
    date: new Date().toISOString().slice(0, 10),
    projectId: String(body.projectId ?? ""),
    taskId: String(body.taskId ?? ""),
    objectKey: String(body.key),
    createdAt: Date.now(),
  };
  await putItem(item);
  return Response.json({ attachment: stripKeys(item) }, { status: 201 });
}

/** DELETE ?id=... → remove an attachment's S3 object + its DynamoDB record. */
export async function DELETE(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const k = key.attach(r.ctx.workspaceId, id);
  const existing = await getItem(k);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  // Best-effort S3 cleanup — fine if S3 isn't configured or the object is gone.
  const objectKey = existing.objectKey;
  if (typeof objectKey === "string" && objectKey) {
    try {
      await deleteObject(objectKey);
    } catch {
      /* ignore — still drop the record below */
    }
  }
  await deleteItem(k);
  return Response.json({ ok: true });
}

/** GET ?key=... → presigned GET url for download/preview (workspace-scoped). */
export async function GET(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!s3Configured) {
    return Response.json({ error: "S3 not configured" }, { status: 501 });
  }

  const objectKey = new URL(request.url).searchParams.get("key");
  if (!objectKey) return Response.json({ error: "key required" }, { status: 400 });
  if (!objectKey.startsWith(`workspaces/${r.ctx.workspaceId}/`)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = await presignDownload(objectKey);
  return Response.json({ url });
}
