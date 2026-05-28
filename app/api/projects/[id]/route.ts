import { deleteItem, getItem, key, putItem, stripKeys } from "@/lib/ddb";
import { canWrite, requireWorkspace } from "@/lib/workspace-server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const existing = await getItem(key.project(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const patch = await request.json().catch(() => ({}));
  // Never let the client overwrite identity/keys.
  delete patch.PK;
  delete patch.SK;
  delete patch.id;
  const next = { ...existing, ...patch };
  await putItem(next);
  return Response.json({ project: stripKeys(next) });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  await deleteItem(key.project(r.ctx.workspaceId, id));
  return Response.json({ ok: true });
}
