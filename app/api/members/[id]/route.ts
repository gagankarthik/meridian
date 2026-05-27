import { deleteItem, getItem, key, putItem, stripKeys } from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

const ADMIN_ROLES = new Set(["Owner", "Admin", "owner", "admin"]);

/**
 * Update a member. Admins can edit anyone (role / project access / profile);
 * any user can edit their OWN profile (name + avatar only).
 */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/members/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const { id } = await ctx.params;
  const isAdmin = ADMIN_ROLES.has(r.ctx.role);
  const isSelf = id === r.ctx.userId;
  if (!isAdmin && !isSelf) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await getItem(key.member(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  // Non-admins editing themselves may only change name + avatar.
  const patch: Record<string, unknown> = {};
  if (isAdmin) {
    Object.assign(patch, body);
    delete patch.PK;
    delete patch.SK;
    delete patch.GSI1PK;
    delete patch.GSI1SK;
    delete patch.id;
  } else {
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.avatar === "string") patch.avatar = body.avatar;
  }

  const next = { ...existing, ...patch };
  await putItem(next);
  return Response.json({ member: stripKeys(next) });
}

/** Remove a member from the workspace. Owner/Admin only. */
export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/members/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!ADMIN_ROLES.has(r.ctx.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  // Don't let an owner delete themselves out of their own workspace.
  if (id === r.ctx.userId) {
    return Response.json(
      { error: "You can't remove yourself" },
      { status: 400 },
    );
  }
  await deleteItem(key.member(r.ctx.workspaceId, id));
  return Response.json({ ok: true });
}
