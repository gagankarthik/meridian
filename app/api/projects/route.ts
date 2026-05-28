import { key, putItem, queryPartition, stripKeys } from "@/lib/ddb";
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

  // The creator always belongs to the project — enforced server-side regardless
  // of the client payload: added as a member, and as the lead when none given.
  // Use the creator's real MEMBER id (not their Cognito sub): invited members
  // are keyed by an invite id ≠ sub, so storing the sub would make the creator
  // fail eligibility on their own project. Falls back to the sub when no member
  // record exists.
  const creator = await resolveMemberId(r.ctx.workspaceId, r.ctx.userId);
  const leadIds: string[] =
    Array.isArray(body.leadIds) && body.leadIds.length ? body.leadIds : [creator];
  const reviewerIds: string[] = Array.isArray(body.reviewerIds)
    ? body.reviewerIds
    : [];
  const memberIds = Array.from(
    new Set<string>([
      creator,
      ...(Array.isArray(body.memberIds) ? body.memberIds : []),
      ...leadIds,
      ...reviewerIds,
    ]),
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
    leadIds,
    reviewerIds,
    memberIds,
    columns: Array.isArray(body.columns) ? body.columns : [],
    description: typeof body.description === "string" ? body.description : "",
  };
  await putItem(project);
  return Response.json({ project: stripKeys(project) }, { status: 201 });
}
