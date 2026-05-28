import { AdminCreateUserCommand, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { ddbConfigured, getItem, key, putItem, withEmailIndex } from "@/lib/ddb";
import {
  cognitoServerClient,
  serverConfigured,
  serverPoolId,
} from "@/lib/cognito-server";
import { projectRoles, requireWorkspace } from "@/lib/workspace-server";

/** Project roles assignable via invite (you can't invite someone as Owner). */
function asProjectRole(raw: string | undefined): "Admin" | "Member" | "Viewer" {
  const r = (raw ?? "").toLowerCase();
  if (r === "admin") return "Admin";
  if (r === "viewer") return "Viewer";
  return "Member";
}

/**
 * Add member ids to a project's team in the given role, keeping the role arrays
 * mutually exclusive. Migrates legacy lead/reviewer projects to the new shape.
 */
async function assignToProject(
  workspaceId: string,
  projectId: string,
  memberIds: string[],
  role: "Admin" | "Member" | "Viewer",
) {
  const p = await getItem(key.project(workspaceId, projectId));
  if (!p) return;
  const roles = projectRoles(p);
  const add = memberIds.filter((id) => id && id !== roles.ownerId);
  const strip = (arr: string[]) => arr.filter((x) => !add.includes(x));
  const next: Record<string, unknown> = {
    ...p,
    ownerId: roles.ownerId,
    adminIds: strip(roles.adminIds),
    memberIds: strip(roles.memberIds),
    viewerIds: strip(roles.viewerIds),
  };
  const field =
    role === "Admin" ? "adminIds" : role === "Viewer" ? "viewerIds" : "memberIds";
  next[field] = [...(next[field] as string[]), ...add];
  delete next.leadIds;
  delete next.reviewerIds;
  await putItem(next);
}

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
function initials(s: string) {
  const p = s.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase().slice(0, 2);
}

/**
 * Invites teammates using Cognito's BUILT-IN invitation email (no SES). The
 * AdminCreateUser call below emails the temp password via the user pool's
 * configured sender — set the pool's email to "Send email with Cognito" in the
 * console (Messaging → Email) to use the built-in sender. A DynamoDB member
 * record is also created so they appear immediately and skip onboarding.
 *
 * Body: { emails: string[]; groups?: string[] }  (groups: "<projectId>#<Role>")
 */
export async function POST(request: Request) {
  let emails: string[] = [];
  let groups: string[] = [];
  try {
    const body = await request.json();
    emails = Array.isArray(body.emails) ? body.emails : [];
    groups = Array.isArray(body.groups) ? body.groups : [];
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (emails.length === 0) {
    return Response.json({ error: "At least one email is required" }, { status: 400 });
  }

  // Demo mode (no AWS): report success so the team UI keeps working locally.
  if (!serverConfigured && !ddbConfigured) {
    return Response.json({
      ok: true,
      skipped: true,
      results: emails.map((email) => ({ email, ok: true })),
    });
  }

  const r = await requireWorkspace(request);
  if ("error" in r) return r.error;
  const wid = r.ctx.workspaceId;

  // groups are "<projectId>#<ProjectRole>". The per-project role lives in the
  // project's own team arrays; the workspace role stays "Member" so a project
  // admin/viewer isn't accidentally a workspace-wide super-admin (only the
  // workspace owner is). Visibility still tracks the member's `projects` list.
  const assignments = groups
    .map((g) => {
      const [pid, rawRole] = g.split("#");
      return { pid, role: asProjectRole(rawRole) };
    })
    .filter((a) => a.pid);
  const projects = Array.from(new Set(assignments.map((a) => a.pid)));

  const results = await Promise.all(
    emails.map(async (email) => {
      let alreadyInvited = false;
      let memberId: string | undefined;
      try {
        if (serverConfigured) {
          const client = cognitoServerClient();
          try {
            await client.send(
              new AdminCreateUserCommand({
                UserPoolId: serverPoolId,
                Username: email,
                DesiredDeliveryMediums: ["EMAIL"],
                UserAttributes: [
                  { Name: "email", Value: email },
                  { Name: "email_verified", Value: "true" },
                  { Name: "name", Value: nameFromEmail(email) },
                ],
              }),
            );
          } catch (e) {
            // Already created but never signed in → RESEND the invite email
            // (covers the "invited earlier, email never arrived" case).
            if ((e as { name?: string })?.name === "UsernameExistsException") {
              alreadyInvited = true;
              await client.send(
                new AdminCreateUserCommand({
                  UserPoolId: serverPoolId,
                  Username: email,
                  MessageAction: "RESEND",
                  DesiredDeliveryMediums: ["EMAIL"],
                }),
              );
            } else {
              throw e;
            }
          }
          for (const g of groups) {
            try {
              await client.send(
                new AdminAddUserToGroupCommand({
                  UserPoolId: serverPoolId,
                  Username: email,
                  GroupName: g,
                }),
              );
            } catch {
              /* group may not exist yet — non-fatal */
            }
          }
        }

        // Only create a member record for a brand-new invite — a RESEND
        // targets someone already in the workspace, so skip (no duplicates).
        if (ddbConfigured && !alreadyInvited) {
          memberId = `inv-${crypto.randomUUID().slice(0, 8)}`;
          const name = nameFromEmail(email);
          await putItem(
            withEmailIndex(
              {
                ...key.member(wid, memberId),
                type: "member",
                id: memberId,
                name,
                email,
                role: "Member",
                initials: initials(name),
                status: "invited",
                hue: "#2563eb",
                projects,
                workspaceId: wid,
              },
              email,
            ),
          );
        }
        return { email, ok: true, resent: alreadyInvited, memberId };
      } catch (err) {
        console.error("[invite] failed for", email, err);
        const e = err as { name?: string; message?: string };
        return {
          email,
          ok: false,
          error: `${e?.name ?? "Error"}: ${e?.message ?? "invite failed"}`,
        };
      }
    }),
  );

  // Place the newly-created members onto each selected project in the chosen
  // role (one read-modify-write per project to avoid clobbering concurrent
  // additions across invitees).
  const newIds = results
    .map((x) => x.memberId)
    .filter((x): x is string => Boolean(x));
  if (ddbConfigured && newIds.length) {
    for (const a of assignments) {
      await assignToProject(wid, a.pid, newIds, a.role);
    }
  }

  return Response.json({ ok: results.every((x) => x.ok), results });
}
