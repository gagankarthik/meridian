/**
 * Mock domain data for the Meridian app shell.
 *
 * Types are modeled to map cleanly onto a future AWS backend:
 *   - Member  → Cognito user (sub) + DynamoDB profile item
 *   - Project / Task / Activity → DynamoDB items (PK = workspaceId, SK = entity#id)
 *   - attachments → S3 objects keyed by workspaceId/taskId
 * Swap these arrays for Amplify Data queries without touching the UI.
 */

export type Role = "Owner" | "Admin" | "Member" | "Viewer" | "Guest";
export type MemberStatus = "active" | "invited";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  status: MemberStatus;
  hue: string;
  projects: string[];
  /** Linked Cognito sub (set on first sign-in). The record id may be an invite
      id, so lookups by sub resolve through this. */
  userId?: string;
  /** Uploaded profile photo (URL/data-URI); falls back to a generated avatar. */
  avatar?: string;
};

export type ColumnId = string;
export type Priority = "Low" | "Medium" | "High" | "Urgent";

/** Ticket type — the kind of work a ticket represents (Jira-style issue type). */
export type TicketType =
  | "Task"
  | "Bug"
  | "Feature"
  | "Improvement"
  | "Chore";
export const TICKET_TYPES: TicketType[] = [
  "Task",
  "Bug",
  "Feature",
  "Improvement",
  "Chore",
];

export type Task = {
  id: string;
  title: string;
  column: ColumnId;
  priority: Priority;
  assigneeId: string;
  assigneeIds: string[];
  projectId: string;
  due: string;
  tag: string;
  tagColor: string;
  /** Member id of whoever created the task (the authenticated creator). */
  createdById?: string;
  /** Optional scheduling / review fields set on creation. */
  startDate?: string;
  reviewerId?: string;
  /** Review workflow: set when a task is sent for review and decided on.
      "pending" while awaiting the reviewer; "approved"/"rejected" after. */
  /** Issue type (Bug/Feature/Task/…). Optional — defaults to "Task" when unset
      so existing tickets keep working. Stored as `ticketType` (not `type`,
      which is the reserved DynamoDB record discriminator). */
  ticketType?: TicketType;
  reviewStatus?: "pending" | "approved" | "rejected";
  /** Reason the reviewer gave when requesting changes (optional). */
  reviewNote?: string;
  /** Member id of who made the last review decision, and when. */
  reviewedById?: string;
  reviewedAt?: number;
  /** Real, user-authored content (persisted) — empty until added. */
  description?: string;
  subtasks?: SubTask[];
  comments?: Comment[];
};

export type Project = {
  id: string;
  name: string;
  key: string;
  color: string;
  progress: number;
  status: "On track" | "At risk" | "Off track";
  open: number;
  /** The member id of the creator. The owner has full control, including
      deleting the project — see [[ProjectRole]]. */
  ownerId: string;
  /** Members with full control except deleting the project. */
  adminIds: string[];
  /** Members who can work on tasks but not edit/delete the project. */
  memberIds: string[];
  /** Members with read-only access to the project. */
  viewerIds: string[];
  /** Short summary shown under the project name. */
  description?: string;
  /** Schedule (ISO yyyy-mm-dd) — drives the roadmap timeline. */
  startDate?: string;
  endDate?: string;
  /** Custom board columns added to THIS project (shown alongside the defaults). */
  columns?: { id: string; name: string }[];
};

export type Activity = {
  id: string;
  who: string;
  initials: string;
  action: string;
  target: string;
  time: string;
};

export const WORKSPACE = {
  name: "Northwind",
  plan: "Business",
};

export const MEMBERS: Member[] = [];

export const PROJECTS: Project[] = [];

export const COLUMNS: { id: ColumnId; name: string }[] = [
  { id: "backlog", name: "Backlog" },
  { id: "todo", name: "To do" },
  { id: "in_progress", name: "In progress" },
  { id: "review", name: "Review" },
  { id: "done", name: "Done" },
];

export const TASKS: Task[] = [];

export const ACTIVITY: Activity[] = [];

export const priorityMeta: Record<Priority, { color: string; label: string }> = {
  Urgent: { color: "#c0362b", label: "P0" },
  High: { color: "#ff4d00", label: "P1" },
  Medium: { color: "#d9842b", label: "P2" },
  Low: { color: "#6c6859", label: "P3" },
};

/** Visual meta for each ticket type. `icon` is a lucide icon name resolved by
    the component (lib stays free of React imports). */
export const ticketTypeMeta: Record<
  TicketType,
  { color: string; icon: string }
> = {
  Task: { color: "#2563eb", icon: "SquareCheck" },
  Bug: { color: "#e5484d", icon: "Bug" },
  Feature: { color: "#7c5cff", icon: "Sparkles" },
  Improvement: { color: "#1d9aaa", icon: "TrendingUp" },
  Chore: { color: "#8b909c", icon: "Wrench" },
};

/** The ticket's issue type, defaulting to "Task" for tickets created before
    the field existed. */
export function ticketTypeOf(t: { ticketType?: TicketType }): TicketType {
  return t.ticketType ?? "Task";
}

/* ---- Runtime store --------------------------------------------------------
   Seeded with the demo arrays above; replaced wholesale with live DynamoDB
   data once a workspace bootstraps (see WorkspaceProvider). The read-only
   helpers below resolve against this, so they reflect whichever source is
   active without every call site needing to change. ------------------------ */
type RuntimeData = {
  members: Member[];
  projects: Project[];
  tasks: Task[];
  columns: { id: ColumnId; name: string }[];
};
const runtime: RuntimeData = {
  members: MEMBERS,
  projects: PROJECTS,
  tasks: TASKS,
  columns: COLUMNS,
};

export function hydrateRuntime(data: Partial<RuntimeData>) {
  if (data.members) runtime.members = data.members;
  if (data.projects) runtime.projects = data.projects;
  if (data.tasks) runtime.tasks = data.tasks;
  if (data.columns?.length) runtime.columns = data.columns;
}

export function memberById(id: string): Member | undefined {
  if (!id) return undefined;
  // Resolve by the record id OR the linked Cognito sub, so ids that reference a
  // user by sub (e.g. createdById, the signed-in user) still find an invited
  // member whose record is keyed by their invite id.
  return runtime.members.find((m) => m.id === id || m.userId === id);
}

export const CURRENT_PROJECT_ID = "p1";
export const ME_ID = "u1";

export type Notification = {
  id: string;
  who: string;
  initials: string;
  hue: string;
  text: string;
  time: string;
  unread: boolean;
  /** Recipient member id — notifications are scoped to a single user. */
  userId?: string;
  /** Deep-link target: open this task when the notification is clicked. */
  taskId?: string;
  /** Creation timestamp (ms) used to render a live relative time. */
  createdAt?: number;
};

export const NOTIFICATIONS: Notification[] = [];

export function projectById(id: string): Project | undefined {
  return runtime.projects.find((p) => p.id === id);
}

export type ProjectRole = "Owner" | "Admin" | "Member" | "Viewer";

/** The member's role on a project, or null when they aren't on its team. */
export function projectRole(
  projectId: string,
  memberId: string,
): ProjectRole | null {
  const p = projectById(projectId);
  if (!p) return null;
  if (p.ownerId === memberId) return "Owner";
  if (p.adminIds.includes(memberId)) return "Admin";
  if (p.memberIds.includes(memberId)) return "Member";
  if (p.viewerIds.includes(memberId)) return "Viewer";
  return null;
}

/** Live task counts for a project, read from the runtime store. */
export function projectTaskStats(projectId: string): {
  total: number;
  done: number;
  open: number;
  progress: number;
} {
  const ts = runtime.tasks.filter((t) => t.projectId === projectId);
  const total = ts.length;
  const done = ts.filter((t) => t.column === "done").length;
  const open = total - done;
  const progress = total ? Math.round((done / total) * 100) : 0;
  return { total, done, open, progress };
}

/** A project's completion %, derived live from its tasks (done ÷ total). */
export function projectProgress(projectId: string): number {
  return projectTaskStats(projectId).progress;
}

/** Count of a project's not-done tasks, derived live. */
export function projectOpenCount(projectId: string): number {
  return projectTaskStats(projectId).open;
}

/** All member ids on a project: owner ∪ admins ∪ members ∪ viewers ∪ task assignees. */
export function projectMemberIds(projectId: string): string[] {
  const p = projectById(projectId);
  const base = p
    ? [p.ownerId, ...p.adminIds, ...p.memberIds, ...p.viewerIds].filter(Boolean)
    : [];
  const fromTasks = runtime.tasks
    .filter((t) => t.projectId === projectId)
    .flatMap((t) => t.assigneeIds);
  return Array.from(new Set([...base, ...fromTasks]));
}

/**
 * Members eligible to be assigned/review a task on a given project: only people
 * who have *joined* (status "active" — never pending invites) AND who are on
 * that project's team or have explicit access to it. Pass the live workspace
 * projects + members so it reflects the current state.
 */
export function eligibleMembersFor(
  projectId: string,
  projects: Project[],
  members: Member[],
): Member[] {
  const p = projects.find((x) => x.id === projectId);
  // Viewers are read-only, so they're never assignable even if their personal
  // access list (member.projects) includes the project.
  const viewers = new Set(p?.viewerIds ?? []);
  const allowed = new Set<string>(
    [p?.ownerId, ...(p?.adminIds ?? []), ...(p?.memberIds ?? [])].filter(
      (x): x is string => Boolean(x),
    ),
  );
  return members.filter(
    (m) =>
      m.status === "active" &&
      (allowed.has(m.id) ||
        (Boolean(m.projects?.includes(projectId)) && !viewers.has(m.id))),
  );
}

export const COLUMN_LABEL: Record<ColumnId, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

/* ---- Task detail ---- */
export type SubTask = { id: string; title: string; done: boolean };
export type Comment = { id: string; authorId: string; text: string; at: number };
export type TaskDetailData = {
  description: string;
  subtasks: SubTask[];
  comments: Comment[];
  reporterId: string;
  reviewerId: string;
  labels: string[];
  startDate: string;
};

/** Derive a task's detail view. Real content (description/subtasks/comments)
   comes straight off the task — no demo data; reporter/reviewer are derived. */
export function getTaskDetail(t: Task): TaskDetailData {
  const project = projectById(t.projectId);
  // Reporter = the real creator of the task. (This used to fall back to the
  // assignee, which made Reporter always mirror Assignee.) Legacy tasks with no
  // recorded creator fall back to the project lead — never the assignee.
  const reporterId = t.createdById || project?.ownerId || "";
  // Reviewer is set per task (no project-level reviewer designation anymore).
  const reviewerId = t.reviewerId || "";
  return {
    description: t.description ?? "",
    subtasks: t.subtasks ?? [],
    comments: t.comments ?? [],
    reporterId,
    reviewerId,
    labels: [t.tag, `${t.priority} priority`].filter(Boolean),
    startDate: t.startDate || "—",
  };
}

/** Human-friendly relative time for comments/activity. */
export function relativeTime(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(at).toLocaleDateString();
}

export function taskKey(t: Task): string {
  const project = projectById(t.projectId);
  const num = Number(t.id.replace(/\D/g, "")) || 0;
  return `${project?.key ?? "TASK"}-${100 + num}`;
}

/** Sub-ticket reference for a subtask, derived from its parent (e.g. LAUNCH-102.1). */
export function subtaskKey(parent: Task, index: number): string {
  return `${taskKey(parent)}.${index + 1}`;
}

/* ---- Approvals ---- */
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type Approval = {
  id: string;
  title: string;
  requestedById: string;
  approverId: string;
  status: ApprovalStatus;
  date: string;
  note: string;
  projectId: string;
};

export const APPROVALS: Approval[] = [];

/* ---- Attachments ---- */
export type Attachment = {
  id: string;
  name: string;
  ext: string;
  size: string;
  uploadedById: string;
  date: string;
  projectId: string;
  /** Set when the file is attached to a specific task + its S3 object key. */
  taskId?: string;
  objectKey?: string;
};

export const ATTACHMENTS: Attachment[] = [];

/* Resolve the active project id from a route searchParam. Runs on the server
   (which can't see live runtime data), so we trust a provided id and let the
   client fall back to its first project when the id isn't found. */
export function resolveProjectId(raw?: string | string[]): string {
  const id = Array.isArray(raw) ? raw[0] : raw;
  return id && id.trim() ? id : CURRENT_PROJECT_ID;
}

/* ---- Goals / OKRs (strategy layer of the lifecycle) ---- */
export type GoalStatus = "On track" | "At risk" | "Off track";
export type KeyResult = { id: string; label: string; progress: number };
export type Goal = {
  id: string;
  title: string;
  quarter: string;
  ownerId: string;
  progress: number;
  status: GoalStatus;
  projectIds: string[];
  keyResults: KeyResult[];
};

export const GOALS: Goal[] = [];

