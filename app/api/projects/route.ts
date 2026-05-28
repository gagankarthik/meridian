import {
  key,
  putItem,
  queryPartition,
  stripKeys,
  withEmailIndex,
} from "@/lib/ddb";
import {
  canWrite,
  requireWorkspace,
  resolveMemberId,
} from "@/lib/workspace-server";

export async function GET(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const items = await queryPartition(`WS#${r.ctx.workspaceId}`);
  const projects = items
    .filter((i) => String(i.SK).startsWith("PROJECT#"))
    .map(stripKeys);
  return Response.json({ projects });
}

export async function POST(request: Request) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  if (!canWrite(r.ctx.role)) {
    return Response.json({ error: "Forbidden — your role is view-only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name: string = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });

  // Honor a safe client id so the optimistic id == the persisted one (column
  // PATCHes and navigation then target the same project).
  const provided = typeof body.id === "string" ? body.id.trim() : "";
  const id = /^[A-Za-z0-9_-]{1,64}$/.test(provided)
    ? provided
    : `p-${crypto.randomUUID().slice(0, 8)}`;
  const k = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PROJ";

  // The creator is the project owner — enforced server-side regardless of the
  // client payload. Use their real MEMBER id (not their Cognito sub): invited
  // members are keyed by an invite id ≠ sub, so storing the sub would make the
  // creator fail eligibility on their own project. Other teammates come from
  // the payload, with the owner stripped out so the roles stay exclusive.
  const owner = await resolveMemberId(r.ctx.workspaceId, r.ctx.userId);
  const without = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x !== "" && x !== owner)
      : [];
  const adminIds = without(body.adminIds);
  const memberIds = without(body.memberIds).filter((x) => !adminIds.includes(x));
  const viewerIds = without(body.viewerIds).filter(
    (x) => !adminIds.includes(x) && !memberIds.includes(x),
  );

  const project = {
    ...key.project(r.ctx.workspaceId, id),
    type: "project",
    id,
    name,
    key: body.key ?? k,
    color: body.color ?? "#2563eb",
    progress: 0,
    status: "On track",
    open: 0,
    ownerId: owner,
    adminIds,
    memberIds,
    viewerIds,
    columns: Array.isArray(body.columns) ? body.columns : [],
    description: typeof body.description === "string" ? body.description : "",
  };
  await putItem(project);

  // Keep each team member's personal access list in sync so the project shows
  // up everywhere it's keyed off `member.projects` (Team page, member detail).
  const onTeam = new Set([owner, ...adminIds, ...memberIds, ...viewerIds]);
  const items = await queryPartition(`WS#${r.ctx.workspaceId}`);
  await Promise.all(
    items
      .filter(
        (it) =>
          String(it.SK).startsWith("MEMBER#") && onTeam.has(String(it.id)),
      )
      .map((m) => {
        const projects = Array.isArray(m.projects) ? m.projects.map(String) : [];
        if (projects.includes(id)) return null;
        const next = { ...m, projects: [...projects, id] };
        const email = typeof m.email === "string" ? m.email : "";
        return putItem(email ? withEmailIndex(next, email) : next);
      })
      .filter(Boolean) as Promise<void>[],
  );

  return Response.json({ project: stripKeys(project) }, { status: 201 });
}
