import { key, putItem, queryPartition, stripKeys } from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

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

  const body = await request.json().catch(() => ({}));
  const name: string = (body.name ?? "").trim();
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });

  const id = `p-${crypto.randomUUID().slice(0, 8)}`;
  const k =
    name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PROJ";
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
    leadIds: body.leadIds ?? [],
    reviewerIds: body.reviewerIds ?? [],
    memberIds: body.memberIds ?? [],
    description: typeof body.description === "string" ? body.description : "",
  };
  await putItem(project);
  return Response.json({ project: stripKeys(project) }, { status: 201 });
}
