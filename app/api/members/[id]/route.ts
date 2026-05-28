import {
  deleteItem,
  getItem,
  key,
  putItem,
  queryByEmail,
  stripKeys,
  withEmailIndex,
} from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

const ADMIN_ROLES = new Set(["Owner", "Admin", "owner", "admin"]);

function initialsOf(s: string): string {
  const p = s.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? p[0]?.[1] ?? ""))
    .toUpperCase()
    .slice(0, 2);
}

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

  // Resolve the member record. It's normally keyed by the given id, but an
  // INVITED member's record stays keyed by their invite id (MEMBER#inv-…) even
  // after their Cognito sub is linked. So for a self-edit where MEMBER#<sub>
  // doesn't exist, fall back to the byEmail GSI and update the REAL record —
  // otherwise a profile-name change 404s and never reaches the row that every
  // other account sees (the cause of names differing across accounts).
  let existing = await getItem(key.member(r.ctx.workspaceId, id));
  if (!existing && isSelf && r.ctx.user.email) {
    const matches = await queryByEmail(r.ctx.user.email);
    existing =
      matches.find(
        (m) =>
          typeof m.SK === "string" &&
          (m.SK as string).startsWith("MEMBER#") &&
          String(m.workspaceId) === r.ctx.workspaceId,
      ) ?? null;
  }
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
    if (typeof body.name === "string") {
      patch.name = body.name;
      patch.initials =
        typeof body.initials === "string" ? body.initials : initialsOf(body.name);
    }
    if (typeof body.avatar === "string") patch.avatar = body.avatar;
  }

  const next = { ...existing, ...patch };
  // Preserve the byEmail GSI so the record stays resolvable by email.
  const email =
    typeof existing.email === "string" ? existing.email : r.ctx.user.email;
  await putItem(email ? withEmailIndex(next, email) : next);

  // Keep the caller's USER profile name in sync so `me.name` and the bootstrap
  // reflect the chosen name on the next load (self name edits only).
  if (isSelf && typeof patch.name === "string") {
    const profile = await getItem(key.user(r.ctx.userId));
    if (profile) await putItem({ ...profile, name: patch.name });
  }

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
  // Don't let anyone delete themselves out of their own workspace.
  if (id === r.ctx.userId) {
    return Response.json(
      { error: "You can't remove yourself" },
      { status: 400 },
    );
  }
  // The workspace Owner can't be removed by anyone (including other admins).
  const target = await getItem(key.member(r.ctx.workspaceId, id));
  if (target && String(target.role ?? "").toLowerCase() === "owner") {
    return Response.json(
      { error: "The workspace owner can't be removed" },
      { status: 403 },
    );
  }
  await deleteItem(key.member(r.ctx.workspaceId, id));
  return Response.json({ ok: true });
}
