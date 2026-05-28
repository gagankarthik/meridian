import { ddbConfigured, key, putItem, withEmailIndex } from "@/lib/ddb";
import { storeWorkspaceLogo } from "@/lib/s3";
import { getServerUser } from "@/lib/server-user";

function initials(s: string) {
  const parts = s.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? ""))
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Creates a brand-new workspace for the signed-in owner (called when a new
 * account finishes onboarding). Invited employees never reach this — they
 * already belong to a workspace and bootstrap straight into the app.
 */
export async function POST(request: Request) {
  if (!ddbConfigured) return Response.json({ ok: true, skipped: true });

  const user = await getServerUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const workspaceName = (body.workspaceName ?? "").trim() || "My workspace";
  const wid = `w-${crypto.randomUUID().slice(0, 8)}`;
  const displayName = user.name ?? user.email ?? "You";

  // Park the logo in S3 (or inline as a compact data URL when S3 is absent) so
  // a real image never blows the 400KB DynamoDB item limit.
  const logoStored =
    typeof body.logo === "string" && body.logo.startsWith("data:")
      ? await storeWorkspaceLogo(wid, body.logo)
      : {};

  await putItem({
    ...key.wsMeta(wid),
    type: "workspace",
    id: wid,
    name: workspaceName,
    plan: "Business",
    ownerId: user.sub,
    company: body.companyName ?? "",
    companySize: body.companySize ?? "",
    industry: body.industry ?? "",
    logoKey: logoStored.logoKey,
    logo: logoStored.logo,
  });
  await putItem({
    ...key.user(user.sub),
    type: "user",
    workspaceId: wid,
    userId: user.sub,
    email: user.email,
    name: displayName,
    role: "Owner",
  });
  await putItem(
    withEmailIndex(
      {
        ...key.member(wid, user.sub),
        type: "member",
        id: user.sub,
        name: displayName,
        email: user.email,
        role: "Owner",
        initials: initials(displayName),
        status: "active",
        hue: "#2563eb",
        projects: [] as string[],
      },
      user.email,
    ),
  );

  // Optional first project from the wizard.
  const projectName: string = (body.projectName ?? "").trim();
  if (projectName) {
    const pid = `p-${crypto.randomUUID().slice(0, 8)}`;
    await putItem({
      ...key.project(wid, pid),
      type: "project",
      id: pid,
      name: projectName,
      key: projectName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PROJ",
      color: "#2563eb",
      progress: 0,
      status: "On track",
      open: 0,
      ownerId: user.sub,
      adminIds: [],
      memberIds: [],
      viewerIds: [],
    });
  }

  return Response.json({ ok: true, workspaceId: wid });
}
