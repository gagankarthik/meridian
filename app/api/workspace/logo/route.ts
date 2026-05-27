import { getItem, key, putItem } from "@/lib/ddb";
import { logoDisplayUrl, storeWorkspaceLogo } from "@/lib/s3";
import { requireWorkspace } from "@/lib/workspace-server";

const ADMIN_ROLES = new Set(["Owner", "Admin", "owner", "admin"]);

/**
 * Upload/replace the workspace logo. Owner/Admin only.
 * The client sends a compact (downscaled) data URL; we store it in S3 when
 * configured (keeping the heavy bytes out of the 400KB DynamoDB item) and
 * return a presigned URL for immediate display. Without S3 we keep the compact
 * data URL inline.
 */
export async function POST(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!ADMIN_ROLES.has(r.ctx.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const dataUrl: string = typeof body.dataUrl === "string" ? body.dataUrl : "";
  if (!dataUrl.startsWith("data:")) {
    return Response.json({ error: "dataUrl required" }, { status: 400 });
  }

  const stored = await storeWorkspaceLogo(r.ctx.workspaceId, dataUrl);

  const existing = await getItem(key.wsMeta(r.ctx.workspaceId));
  const next = {
    ...(existing ?? { ...key.wsMeta(r.ctx.workspaceId), id: r.ctx.workspaceId }),
    type: "workspace",
    // Store exactly one form; clear the other so stale data can't win.
    logoKey: stored.logoKey,
    logo: stored.logo,
  };
  await putItem(next);

  const logo = stored.logoKey
    ? await logoDisplayUrl(stored.logoKey)
    : (stored.logo ?? "");
  return Response.json({ logo });
}
