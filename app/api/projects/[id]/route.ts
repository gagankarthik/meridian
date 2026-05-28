import {
  deleteItem,
  getItem,
  key,
  putItem,
  queryPartition,
  stripKeys,
  withEmailIndex,
} from "@/lib/ddb";
import {
  getProjectRole,
  projectRoles,
  requireWorkspace,
} from "@/lib/workspace-server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const { id } = await ctx.params;

  // Editing project settings/team is an Owner/Admin action.
  const role = await getProjectRole(r.ctx.workspaceId, id, r.ctx.userId, r.ctx.role);
  if (role !== "Owner" && role !== "Admin") {
    return Response.json(
      { error: "Forbidden — only an owner or admin can edit this project" },
      { status: 403 },
    );
  }

  const existing = await getItem(key.project(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const patch = await request.json().catch(() => ({}));
  // Never let the client overwrite identity/keys or transfer ownership here.
  delete patch.PK;
  delete patch.SK;
  delete patch.id;
  delete patch.ownerId;
  const next: Record<string, unknown> = { ...existing, ...patch };

  // Migrate legacy lead/reviewer projects to the owner/admin/member/viewer
  // shape on write, so a role change persists instead of being shadowed by the
  // old fields. Role arrays the patch set explicitly win over the derived ones.
  if (!next.ownerId) {
    const base = projectRoles(existing);
    next.ownerId = base.ownerId;
    if (!("adminIds" in patch)) next.adminIds = base.adminIds;
    if (!("memberIds" in patch)) next.memberIds = base.memberIds;
    if (!("viewerIds" in patch)) next.viewerIds = base.viewerIds;
  }
  delete next.leadIds;
  delete next.reviewerIds;

  await putItem(next);
  return Response.json({ project: stripKeys(next) });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const { id } = await ctx.params;

  // Only the project owner (or a workspace super-admin) may delete a project.
  const role = await getProjectRole(r.ctx.workspaceId, id, r.ctx.userId, r.ctx.role);
  if (role !== "Owner") {
    return Response.json(
      { error: "Forbidden — only the project owner can delete it" },
      { status: 403 },
    );
  }

  const items = await queryPartition(`WS#${r.ctx.workspaceId}`);
  await deleteItem(key.project(r.ctx.workspaceId, id));

  // Cascade: remove the project's own records (tasks, approvals, attachments)
  // so nothing is left orphaned pointing at a project that no longer exists.
  const children = items.filter((it) => {
    const sk = String(it.SK);
    const owned =
      sk.startsWith("TASK#") ||
      sk.startsWith("APPROVAL#") ||
      sk.startsWith("ATTACH#");
    return owned && String(it.projectId) === id;
  });
  await Promise.all(
    children.map((it) =>
      deleteItem({ PK: String(it.PK), SK: String(it.SK) }),
    ),
  );

  // Scrub the project from every member's personal access list.
  const members = items.filter(
    (it) =>
      String(it.SK).startsWith("MEMBER#") &&
      Array.isArray(it.projects) &&
      (it.projects as unknown[]).includes(id),
  );
  await Promise.all(
    members.map((m) => {
      const next = {
        ...m,
        projects: (m.projects as string[]).filter((p) => p !== id),
      };
      const email = typeof m.email === "string" ? m.email : "";
      return putItem(email ? withEmailIndex(next, email) : next);
    }),
  );

  return Response.json({ ok: true });
}
