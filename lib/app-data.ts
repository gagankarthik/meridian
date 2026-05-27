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
  /** Uploaded profile photo (URL/data-URI); falls back to a generated avatar. */
  avatar?: string;
};

export type ColumnId = string;
export type Priority = "Low" | "Medium" | "High" | "Urgent";

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
  /** Optional scheduling / review fields set on creation. */
  startDate?: string;
  reviewerId?: string;
};

export type Project = {
  id: string;
  name: string;
  key: string;
  color: string;
  progress: number;
  status: "On track" | "At risk" | "Off track";
  open: number;
  leadIds: string[];
  reviewerIds: string[];
  memberIds: string[];
  /** Short summary shown under the project name. */
  description?: string;
  /** Schedule (ISO yyyy-mm-dd) — drives the roadmap timeline. */
  startDate?: string;
  endDate?: string;
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
  return runtime.members.find((m) => m.id === id);
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
};

export const NOTIFICATIONS: Notification[] = [];

export function projectById(id: string): Project | undefined {
  return runtime.projects.find((p) => p.id === id);
}

export type ProjectRole = "Lead" | "Reviewer" | "Member";

export function projectRole(projectId: string, memberId: string): ProjectRole {
  const p = projectById(projectId);
  if (p?.leadIds.includes(memberId)) return "Lead";
  if (p?.reviewerIds.includes(memberId)) return "Reviewer";
  return "Member";
}

/** All member ids on a project: declared members ∪ leads ∪ reviewers ∪ task assignees. */
export function projectMemberIds(projectId: string): string[] {
  const p = projectById(projectId);
  const base = p ? [...p.memberIds, ...p.leadIds, ...p.reviewerIds] : [];
  const fromTasks = runtime.tasks
    .filter((t) => t.projectId === projectId)
    .flatMap((t) => t.assigneeIds);
  return Array.from(new Set([...base, ...fromTasks]));
}

export const COLUMN_LABEL: Record<ColumnId, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

/* ---- Task detail (synthesized deterministically from a task) ---- */
export type SubTask = { id: string; title: string; done: boolean };
export type TaskDetailData = {
  description: string;
  subtasks: SubTask[];
  reporterId: string;
  reviewerId: string;
  labels: string[];
  startDate: string;
  created: string;
};

const START_DATES = [
  "Jun 02, 2026",
  "Jun 09, 2026",
  "Jun 16, 2026",
  "Jun 23, 2026",
  "Jun 30, 2026",
];

export function getTaskDetail(t: Task): TaskDetailData {
  const idx = Number(t.id.replace(/\D/g, "")) || 1;
  const project = projectById(t.projectId);
  const roster = runtime.members;
  // Reporter falls back to the assignee, then any member — never a fixed seed.
  const reporterId =
    t.assigneeId ||
    project?.leadIds[0] ||
    roster[idx % (roster.length || 1)]?.id ||
    "";
  // Reviewer prefers the task's own field, then the project's reviewer.
  const reviewerId = t.reviewerId || project?.reviewerIds[0] || "";
  const advanced = t.column === "review" || t.column === "done";
  const shipped = t.column === "done";
  return {
    description:
      `${t.title} sits in the ${t.tag} workstream. This captures the scope, implementation, and review needed to ship it. ` +
      `Keep the checklist current, loop in the reporter on changes, and attach specs or designs in the Attachments tab.`,
    subtasks: [
      { id: `${t.id}-s1`, title: "Define scope & acceptance criteria", done: true },
      { id: `${t.id}-s2`, title: `Implement ${t.tag.toLowerCase()} changes`, done: advanced },
      { id: `${t.id}-s3`, title: "Write tests & documentation", done: shipped },
      { id: `${t.id}-s4`, title: "Review & sign-off", done: shipped },
    ],
    reporterId,
    reviewerId,
    labels: [t.tag, `${t.priority} priority`],
    startDate: t.startDate || START_DATES[idx % START_DATES.length],
    created: t.due && t.due !== "—" ? `Created for ${t.due}` : "Recently",
  };
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

