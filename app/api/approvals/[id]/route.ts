import { getItem, key, putItem, stripKeys } from "@/lib/ddb";
import { requireWorkspace } from "@/lib/workspace-server";

const STATUSES = new Set(["pending", "approved", "rejected"]);

/** Update an approval's status (approve / reject / reset). */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/approvals/[id]">,
) {
  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => ({}));
  if (!STATUSES.has(body.status)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  const existing = await getItem(key.approval(r.ctx.workspaceId, id));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const next = { ...existing, status: body.status };
  await putItem(next);
  return Response.json({ approval: stripKeys(next) });
}
