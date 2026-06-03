import "server-only";
import {
  getItem,
  key,
  putItem,
  queryByEmail,
  queryPartition,
  withEmailIndex,
} from "@/lib/ddb";
import { getServerUser, type ServerUser } from "@/lib/server-user";

function initialsOf(s: string) {
  const parts = s.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? ""))
    .toUpperCase()
    .slice(0, 2);
}

/**
 * The email-derived display name used at invite time (mirrors
 * `nameFromEmail` in `app/api/team/invite/route.ts`). Used to detect the
 * placeholder so we never treat it as a real chosen name.
 */
function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Fill in (or upgrade) the caller's member record with their chosen profile
 * name and matching initials when — and only when — the stored name is still
 * missing or the invite-time email-derived placeholder, then persist the fix
 * so EVERY account sees the same name on their next bootstrap. The member
 * record may be keyed by the user's sub (returning owner/member) or by an
 * invite id (an invited member linked on first sign-in), so we resolve it via
 * the sub first and fall back to the byEmail GSI.
 *
 * This is intentionally NON-DESTRUCTIVE: once the user has a real chosen name
 * on their member record we leave it alone. Otherwise a stale token `name`
 * claim (e.g. when the best-effort Cognito attribute sync on the profile page
 * didn't land) would keep reverting their chosen name back to the placeholder
 * on every sign-in. The chosen profile name is the single source of truth.
 */
async function reconcileMemberName(
  workspaceId: string,
  user: ServerUser,
  realName: string,
): Promise<void> {
  let member = await getItem(key.member(workspaceId, user.sub));
  if (!member && user.email) {
    const matches = await queryByEmail(user.email);
    member =
      matches.find(
        (m) =>
          typeof m.SK === "string" &&
          (m.SK as string).startsWith("MEMBER#") &&
          String(m.workspaceId) === workspaceId,
      ) ?? null;
  }
  if (!member) return;

  const stored = typeof member.name === "string" ? member.name.trim() : "";
  // Only fill in / correct the name when the stored value is empty or still
  // the email-derived invite placeholder. A real chosen name wins and is never
  // overwritten from the (possibly stale) token.
  const isPlaceholder =
    !stored ||
    (!!user.email && stored === nameFromEmail(user.email));
  if (!isPlaceholder) return;
  if (stored === realName) return;

  await putItem(
    user.email
      ? withEmailIndex(
          { ...member, name: realName, initials: initialsOf(realName) },
          user.email,
        )
      : { ...member, name: realName, initials: initialsOf(realName) },
  );
}

export type WorkspaceContext = {
  user: ServerUser;
  workspaceId: string;
  userId: string;
  role: string;
};

/**
 * Resolve the caller's real MEMBER id within a workspace. Member records may be
 * keyed by an invite id (≠ the user's Cognito sub), so storing the sub as a
 * project lead/member can mismatch the member's own record. We look for the
 * MEMBER# item whose linked `userId` (or `id`) equals the sub and return its
 * `id`; falls back to the sub itself when no member record exists.
 */
export async function resolveMemberId(
  workspaceId: string,
  sub: string,
): Promise<string> {
  const items = await queryPartition(`WS#${workspaceId}`);
  const member = items.find(
    (i) =>
      typeof i.SK === "string" &&
      (i.SK as string).startsWith("MEMBER#") &&
      (i.userId === sub || i.id === sub),
  );
  if (member && typeof member.id === "string" && member.id) return member.id;
  return sub;
}

export type ServerProjectRole = "Owner" | "Admin" | "Member" | "Viewer";

/**
 * Normalize a raw project item's role membership into the
 * owner/admin/member/viewer shape, tolerating legacy items that still carry the
 * old `leadIds`/`reviewerIds` fields (lead[0] → owner, the rest → admins,
 * reviewers + members → members). The single place that understands both
 * shapes, so readers don't each reinvent the migration.
 */
export function projectRoles(project: Record<string, unknown>): {
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  viewerIds: string[];
} {
  const arr = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && Boolean(x))
      : [];

  if (typeof project.ownerId === "string" && project.ownerId) {
    return {
      ownerId: project.ownerId,
      adminIds: arr(project.adminIds),
      memberIds: arr(project.memberIds),
      viewerIds: arr(project.viewerIds),
    };
  }

  // Legacy shape.
  const leads = arr(project.leadIds);
  const ownerId = leads[0] ?? arr(project.memberIds)[0] ?? "";
  const adminIds = leads.slice(1);
  const rest = new Set<string>([
    ...arr(project.reviewerIds),
    ...arr(project.memberIds),
  ]);
  rest.delete(ownerId);
  for (const a of adminIds) rest.delete(a);
  return { ownerId, adminIds, memberIds: Array.from(rest), viewerIds: [] };
}

/**
 * Compute the set of member ids that may be assigned to / review tasks on a
 * given project (defense-in-depth: the UI restricts the pickers, but write
 * routes must enforce it too). The eligible set is:
 *   - the project's owner ∪ admins ∪ members (viewers are read-only), plus
 *   - any non-viewer member whose `projects` array includes the projectId —
 *     for those we add BOTH the member's `id` and its linked `userId` (a task
 *     may reference either, since invited members are keyed by an invite id ≠
 *     their sub).
 *
 * Reads the whole workspace partition once; callers should do this at most once
 * per write. Returns an empty set if the project can't be found.
 */
export async function eligibleAssigneeIds(
  workspaceId: string,
  projectId: string,
): Promise<Set<string>> {
  const items = await queryPartition(`WS#${workspaceId}`);
  const eligible = new Set<string>();

  const project = items.find(
    (i) =>
      typeof i.SK === "string" && (i.SK as string) === `PROJECT#${projectId}`,
  );
  if (!project) return eligible;

  const roles = projectRoles(project);
  if (roles.ownerId) eligible.add(roles.ownerId);
  for (const id of [...roles.adminIds, ...roles.memberIds]) eligible.add(id);
  const viewers = new Set(roles.viewerIds);

  for (const item of items) {
    if (typeof item.SK !== "string" || !(item.SK as string).startsWith("MEMBER#"))
      continue;
    const projects = item.projects;
    if (Array.isArray(projects) && projects.includes(projectId)) {
      const ids = [item.id, item.userId].filter(
        (x): x is string => typeof x === "string" && Boolean(x),
      );
      if (ids.some((id) => viewers.has(id))) continue; // viewers stay read-only
      for (const id of ids) eligible.add(id);
    }
  }

  return eligible;
}

/**
 * The caller's role on a specific project, enforced server-side. The workspace
 * owner/admin is a super-admin (treated as project Owner everywhere). Otherwise
 * we resolve the caller's member id (which may be an invite id ≠ their sub) and
 * look it up in the project's role arrays; a project on their personal access
 * list counts as Member. Returns null when they have no access.
 */
export async function getProjectRole(
  workspaceId: string,
  projectId: string,
  userId: string,
  workspaceRole: string,
): Promise<ServerProjectRole | null> {
  if (["owner", "admin"].includes((workspaceRole ?? "").toLowerCase()))
    return "Owner";

  const items = await queryPartition(`WS#${workspaceId}`);
  const project = items.find(
    (i) => typeof i.SK === "string" && (i.SK as string) === `PROJECT#${projectId}`,
  );
  if (!project) return null;
  const roles = projectRoles(project);

  const member = items.find(
    (i) =>
      typeof i.SK === "string" &&
      (i.SK as string).startsWith("MEMBER#") &&
      (i.userId === userId || i.id === userId),
  );
  const ids = new Set<string>([userId]);
  if (member && typeof member.id === "string") ids.add(member.id);

  if (ids.has(roles.ownerId)) return "Owner";
  if (roles.adminIds.some((x) => ids.has(x))) return "Admin";
  if (roles.memberIds.some((x) => ids.has(x))) return "Member";
  if (roles.viewerIds.some((x) => ids.has(x))) return "Viewer";
  if (Array.isArray(member?.projects) && member!.projects.includes(projectId))
    return "Member";
  return null;
}

/**
 * Write-permission gate. Owner/Admin/Member/Editor may mutate workspace data;
 * Viewer/Guest are read-only and must be rejected (HTTP 403) by write routes.
 */
export function canWrite(role: string): boolean {
  return !["viewer", "guest"].includes((role ?? "").toLowerCase());
}

/**
 * Create one notification per recipient, scoped to that user (the `userId`
 * field is the recipient's MEMBER id, which bootstrap filters on). The actor
 * (whoever triggered it) is resolved for the "who"/avatar and is never notified
 * about their own action. `recipientIds` may contain member ids OR Cognito subs
 * — both are resolved to the canonical member id. Best-effort: callers wrap in
 * try/catch so a notification failure never blocks the underlying write.
 */
export async function notifyMembers(
  workspaceId: string,
  actorSub: string,
  recipientIds: string[],
  text: string,
  taskId: string,
): Promise<void> {
  const recips = Array.from(new Set(recipientIds.filter(Boolean)));
  if (recips.length === 0) return;

  const items = await queryPartition(`WS#${workspaceId}`);
  const members = items.filter(
    (i) => typeof i.SK === "string" && (i.SK as string).startsWith("MEMBER#"),
  );
  const actor = members.find((m) => m.userId === actorSub || m.id === actorSub);
  const who = (typeof actor?.name === "string" && actor.name) || "Someone";
  const initials =
    (typeof actor?.initials === "string" && actor.initials) ||
    who.slice(0, 2).toUpperCase();
  const hue = (typeof actor?.hue === "string" && actor.hue) || "#2563eb";

  // The actor's own ids — never notify yourself about your own action.
  const actorIds = new Set(
    [actorSub, typeof actor?.id === "string" ? actor.id : undefined].filter(
      (x): x is string => Boolean(x),
    ),
  );

  // Resolve every recipient to its canonical member id, de-duplicated.
  const recipientMemberIds = new Set<string>();
  for (const rid of recips) {
    if (actorIds.has(rid)) continue;
    const m = members.find((x) => x.id === rid || x.userId === rid);
    const memberId = m && typeof m.id === "string" ? m.id : rid;
    if (actorIds.has(memberId)) continue;
    recipientMemberIds.add(memberId);
  }
  if (recipientMemberIds.size === 0) return;

  const now = Date.now();
  await Promise.all(
    Array.from(recipientMemberIds).map((userId, i) => {
      const id = `n-${now.toString(36)}${i}${Math.random().toString(36).slice(2, 6)}`;
      return putItem({
        ...key.notification(workspaceId, id),
        type: "notification",
        id,
        userId,
        who,
        initials,
        hue,
        text,
        taskId: taskId || "",
        time: "",
        unread: true,
        createdAt: now,
      });
    }),
  );
}

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
    const workspaceId = String(profile.workspaceId);
    const role = String(profile.role ?? "Member");
    // Returning user: their account name (from the token) is the source of
    // truth. Reconcile the stored member record (which may still carry the
    // email-derived placeholder from invite time, or an older name) and
    // PERSIST the fix server-side so EVERY other account sees the same name on
    // their next bootstrap — not just this viewer client-side. We look the
    // member up by the user's sub first, then fall back to the email GSI for
    // invited members whose record is still keyed by their invite id.
    const realName = user.name?.trim();
    if (realName) {
      await reconcileMemberName(workspaceId, user, realName);
    }
    return { user, workspaceId, userId: user.sub, role };
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
      // shows everywhere: team list, avatars, assignees, comments, etc. The
      // email-derived placeholder from invite time is only a last resort.
      const displayName =
        user.name?.trim() || String(member.name ?? user.email);
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
