import { AdminCreateUserCommand, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { ddbConfigured, key, putItem, withEmailIndex } from "@/lib/ddb";
import {
  cognitoServerClient,
  serverConfigured,
  serverPoolId,
} from "@/lib/cognito-server";
import { requireWorkspace } from "@/lib/workspace-server";

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
 * Invites teammates: creates the Cognito user (emails them a temp password)
 * and a DynamoDB member record under the inviter's workspace so they appear
 * immediately and skip onboarding on first sign-in.
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

  const projects = groups.map((g) => g.split("#")[0]).filter(Boolean);
  const role = groups.length ? (groups[0].split("#")[1] ?? "Member") : "Member";

  const results = await Promise.all(
    emails.map(async (email) => {
      try {
        if (serverConfigured) {
          const client = cognitoServerClient();
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

        if (ddbConfigured) {
          const memberId = `inv-${crypto.randomUUID().slice(0, 8)}`;
          const name = nameFromEmail(email);
          await putItem(
            withEmailIndex(
              {
                ...key.member(wid, memberId),
                type: "member",
                id: memberId,
                name,
                email,
                role,
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
        return { email, ok: true };
      } catch (err) {
        return {
          email,
          ok: false,
          error: err instanceof Error ? err.message : "invite failed",
        };
      }
    }),
  );

  return Response.json({ ok: results.every((x) => x.ok), results });
}
