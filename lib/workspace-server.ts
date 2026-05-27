import "server-only";
import {
  getItem,
  key,
  putItem,
  queryByEmail,
  withEmailIndex,
} from "@/lib/ddb";
import { getServerUser, type ServerUser } from "@/lib/server-user";

function initialsOf(s: string) {
  const parts = s.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? ""))
    .toUpperCase()
    .slice(0, 2);
}

export type WorkspaceContext = {
  user: ServerUser;
  workspaceId: string;
  userId: string;
  role: string;
};

/**
 * Resolve the caller's workspace:
 *  - by their Cognito sub (returning member/owner), or
 *  - by their email (an invited member created before first sign-in — we link
 *    the sub and activate them), or
 *  - null when they have no workspace yet (a new owner who must onboard).
 */
export async function resolveWorkspace(
  user: ServerUser,
): Promise<WorkspaceContext | null> {
  const profile = await getItem(key.user(user.sub));
  if (profile?.workspaceId) {
    return {
      user,
      workspaceId: String(profile.workspaceId),
      userId: user.sub,
      role: String(profile.role ?? "Member"),
    };
  }

  if (user.email) {
    const matches = await queryByEmail(user.email);
    const member = matches.find(
      (m) => typeof m.SK === "string" && (m.SK as string).startsWith("MEMBER#"),
    );
    if (member?.workspaceId) {
      const workspaceId = String(member.workspaceId);
      const role = String(member.role ?? "Member");
      // The name the invited user just set (on first sign-in) lives on the
      // token — adopt it for the member record (and recompute initials) so it
      // shows everywhere: team list, avatars, assignees, comments, etc.
      const displayName = user.name?.trim() || String(member.name ?? user.email);
      await putItem({
        ...key.user(user.sub),
        type: "user",
        workspaceId,
        userId: user.sub,
        email: user.email,
        name: displayName,
        role,
      });
      await putItem(
        withEmailIndex(
          {
            ...member,
            status: "active",
            userId: user.sub,
            name: displayName,
            initials: initialsOf(displayName),
          },
          user.email,
        ),
      );
      return { user, workspaceId, userId: user.sub, role };
    }
  }

  return null;
}

/**
 * Route guard. Returns the workspace context, or a Response to return early
 * (401 unauthenticated, 409 needs onboarding). In demo mode (no Cognito) it
 * returns null context so handlers can no-op gracefully.
 */
export async function requireWorkspace(
  request: Request,
): Promise<{ ctx: WorkspaceContext } | { error: Response }> {
  const user = await getServerUser(request);
  if (!user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const ctx = await resolveWorkspace(user);
  if (!ctx) {
    return {
      error: Response.json({ error: "No workspace", needsOnboarding: true }, { status: 409 }),
    };
  }
  return { ctx };
}
