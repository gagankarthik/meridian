import { ddbConfigured, key, queryPartition, getItem } from "@/lib/ddb";
import { logoDisplayUrl } from "@/lib/s3";
import { getServerUser } from "@/lib/server-user";
import { projectRoles, resolveWorkspace } from "@/lib/workspace-server";

/** Strip internal single-table keys before sending to the client. */
function clean(item: Record<string, unknown>) {
  const { PK, SK, GSI1PK, GSI1SK, type, ...rest } = item;
  void PK;
  void SK;
  void GSI1PK;
  void GSI1SK;
  void type;
  return rest;
}

/**
 * Loads the signed-in user's entire workspace in a single query:
 * { workspace, me, role, members, projects, tasks, columns }.
 */
export async function GET(request: Request) {
  if (!ddbConfigured) {
    // Demo mode: the client keeps using its built-in seed data.
    return Response.json({ demo: true });
  }

  const user = await getServerUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ctx, items, meta;
  try {
    ctx = await resolveWorkspace(user);
    if (!ctx) {
      return Response.json({ needsOnboarding: true }, { status: 200 });
    }
    [items, meta] = await Promise.all([
      queryPartition(`WS#${ctx.workspaceId}`),
      getItem(key.wsMeta(ctx.workspaceId)),
    ]);
  } catch (err) {
    // Surface the real cause in server logs (e.g. Amplify CloudWatch) AND in
    // the response so it's visible in the browser Network tab. The most common
    // production failures are: missing AWS credentials (set an IAM role or
    // MERIDIAN_AWS_* env vars — `AWS_` is reserved on Amplify), an IAM policy
    // without dynamodb:Query/GetItem, or a wrong table name / region.
    console.error("[bootstrap] DynamoDB access failed:", err);
    const e = err as { name?: string; message?: string };
    return Response.json(
      {
        error: "Workspace data unavailable.",
        detail: `${e?.name ?? "Error"}: ${e?.message ?? String(err)}`,
        hint: "Check the app's AWS credentials/role, IAM permissions (dynamodb:Query, GetItem), and that NEXT_PUBLIC_AWS_REGION + NEXT_PUBLIC_AWS_DYNAMODB_TABLE_NAME match where your data lives.",
      },
      { status: 500 },
    );
  }

  const members: Record<string, unknown>[] = [];
  const projects: Record<string, unknown>[] = [];
  const tasks: Record<string, unknown>[] = [];
  const columns: Record<string, unknown>[] = [];
  const activity: Record<string, unknown>[] = [];
  const notifications: Record<string, unknown>[] = [];
  const approvals: Record<string, unknown>[] = [];
  const attachments: Record<string, unknown>[] = [];

  for (const it of items) {
    const sk = String(it.SK);
    if (sk.startsWith("MEMBER#")) members.push(clean(it));
    else if (sk.startsWith("PROJECT#")) {
      // Normalize to the owner/admin/member/viewer shape (handles legacy
      // lead/reviewer items) so the client always gets the current shape.
      const c = clean(it);
      delete c.leadIds;
      delete c.reviewerIds;
      projects.push({ ...c, ...projectRoles(it) });
    }
    else if (sk.startsWith("TASK#")) tasks.push(clean(it));
    else if (sk.startsWith("COLUMN#")) columns.push(clean(it));
    else if (sk.startsWith("ACTIVITY#")) activity.push(clean(it));
    else if (sk.startsWith("NOTIF#")) notifications.push(clean(it));
    else if (sk.startsWith("APPROVAL#")) approvals.push(clean(it));
    else if (sk.startsWith("ATTACH#")) attachments.push(clean(it));
  }

  // Newest first for time-ordered feeds.
  const byCreatedDesc = (a: Record<string, unknown>, b: Record<string, unknown>) =>
    Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0);

  // Resolve the workspace logo: presign the S3 object when stored there,
  // otherwise fall back to an inline (compact) data URL.
  const workspace = meta ? clean(meta) : { id: ctx.workspaceId };
  if (typeof workspace.logoKey === "string" && workspace.logoKey) {
    try {
      workspace.logo = await logoDisplayUrl(workspace.logoKey);
    } catch {
      /* leave logo unset if presigning fails */
    }
  }
  delete workspace.logoKey;

  // ── Project-level visibility ───────────────────────────────────────────
  // Owners/admins see every project; everyone else sees only the projects
  // they've been added to (granted on their member record, or listed on the
  // project as lead/reviewer/member). Tasks/approvals/attachments are scoped
  // to the visible projects so hidden work never reaches the client.
  const isAdmin = ["owner", "admin"].includes(ctx.role.toLowerCase());
  let visibleProjects = projects;
  let visibleTasks = tasks;
  let visibleApprovals = approvals;
  let visibleAttachments = attachments;

  if (!isAdmin) {
    const myMember = members.find(
      (m) => m.userId === ctx.userId || m.id === ctx.userId,
    );
    const granted = new Set(
      Array.isArray(myMember?.projects)
        ? (myMember!.projects as unknown[]).map(String)
        : [],
    );
    const myIds = [ctx.userId, myMember?.id]
      .filter(Boolean)
      .map((x) => String(x));
    const onProject = (arr: unknown) =>
      Array.isArray(arr) && arr.some((x) => myIds.includes(String(x)));

    visibleProjects = projects.filter(
      (p) =>
        granted.has(String(p.id)) ||
        myIds.includes(String(p.ownerId)) ||
        onProject(p.adminIds) ||
        onProject(p.memberIds) ||
        onProject(p.viewerIds),
    );
    const visibleIds = new Set(visibleProjects.map((p) => String(p.id)));
    visibleTasks = tasks.filter((t) => visibleIds.has(String(t.projectId)));
    visibleApprovals = approvals.filter((a) =>
      visibleIds.has(String(a.projectId)),
    );
    visibleAttachments = attachments.filter((a) =>
      visibleIds.has(String(a.projectId)),
    );
  }

  return Response.json({
    workspace,
    me: { id: ctx.userId, email: user.email, name: user.name, role: ctx.role },
    role: ctx.role,
    members,
    projects: visibleProjects,
    tasks: visibleTasks,
    columns: columns.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
    activity: activity.sort(byCreatedDesc),
    notifications: notifications.sort(byCreatedDesc),
    approvals: visibleApprovals.sort(byCreatedDesc),
    attachments: visibleAttachments.sort(byCreatedDesc),
  });
}
