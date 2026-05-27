import { deleteItem, getItem, key, putItem, stripKeys } from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const { id } = await ctx.params;

  const existing = await getItem(key.task(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const patch = await request.json().catch(() => ({}));
  delete patch.PK;
  delete patch.SK;
  delete patch.id;
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
  const { id } = await ctx.params;
  await deleteItem(key.task(r.ctx.workspaceId, id));
  return Response.json({ ok: true });
}
