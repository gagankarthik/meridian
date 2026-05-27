import { getItem, key, putItem, stripKeys } from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

const ADMIN_ROLES = new Set(["Owner", "Admin", "owner", "admin"]);

/** Update workspace/org details (name, company, logo). Owner/Admin only. */
export async function PATCH(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!ADMIN_ROLES.has(r.ctx.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const patch = await request.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};
  if (typeof patch.name === "string") allowed.name = patch.name;
  if (typeof patch.company === "string") allowed.company = patch.company;
  if (typeof patch.companySize === "string") allowed.companySize = patch.companySize;
  if (typeof patch.industry === "string") allowed.industry = patch.industry;
  // Note: the logo is uploaded via POST /api/workspace/logo (S3-backed), not here.

  const existing = await getItem(key.wsMeta(r.ctx.workspaceId));
  const next = {
    ...(existing ?? { ...key.wsMeta(r.ctx.workspaceId), id: r.ctx.workspaceId }),
    ...allowed,
    type: "workspace",
  };
  await putItem(next);
  return Response.json({ workspace: stripKeys(next) });
}
