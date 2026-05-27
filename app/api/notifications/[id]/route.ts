import { getItem, key, putItem, stripKeys } from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

/** Mark a notification read/unread. */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/notifications/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => ({}));
  const existing = await getItem(key.notification(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const next = { ...existing, unread: Boolean(body.unread) };
  await putItem(next);
  return Response.json({ notification: stripKeys(next) });
}
