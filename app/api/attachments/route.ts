import { presignDownload, presignUpload, s3Configured } from "@/lib/s3";
import { requireWorkspace } from "@/lib/workspace-server";

/** POST → presigned PUT url for a direct browser upload, scoped to the workspace. */
export async function POST(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
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
