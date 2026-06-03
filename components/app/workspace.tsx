"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ACTIVITY,
  APPROVALS,
  ATTACHMENTS,
  COLUMNS,
  DOCUMENTS,
  MEMBERS,
  ME_ID,
  NOTIFICATIONS,
  PROJECTS,
  TASKS,
  hydrateRuntime,
  type Activity,
  type Approval,
  type Attachment,
  type Comment,
  type DocFile,
  type Member,
  type Notification,
  type Priority,
  type Project,
  type ProjectRole,
  type SubTask,
  type Task,
  type TicketType,
} from "@/lib/app-data";
import { cognitoConfigured } from "@/lib/cognito";
import { authedFetch } from "@/lib/api-client";

export type Role = "admin" | "editor" | "viewer";
export const ROLES: Role[] = ["admin", "editor", "viewer"];

/** Map a Cognito/workspace role (Owner/Admin/Member/Viewer/…) to a permission tier. */
export function mapRole(role: string | undefined): Role {
  const r = (role ?? "").toLowerCase();
  if (r === "owner" || r === "admin") return "admin";
  if (r === "member" || r === "editor") return "editor";
  return "viewer";
}

export type Column = { id: string; name: string };
export type WsAction =
  | "create"
  | "edit"
  | "delete"
  | "assign"
  | "manage"
  | "deleteProject";

export type NewTask = {
  title: string;
  column: string;
  projectId: string;
  assigneeId?: string;
  assigneeIds?: string[];
  priority?: Priority;
  ticketType?: TicketType;
  tag?: string;
  tagColor?: string;
  due?: string;
  startDate?: string;
  reviewerId?: string;
  description?: string;
  subtasks?: SubTask[];
};

export type NewProject = {
  name: string;
  key: string;
  color: string;
  description?: string;
  /** Teammates to add up front; the creator is always the owner. */
  adminIds?: string[];
  memberIds?: string[];
  viewerIds?: string[];
};

type WorkspaceCtx = {
  loading: boolean;
  me: { id: string; name: string; email: string; role: string };
  workspace: {
    id: string;
    name: string;
    company?: string;
    logo?: string;
    companySize?: string;
    industry?: string;
    plan?: string;
  };
  updateWorkspace: (patch: {
    name?: string;
    company?: string;
    logo?: string;
    companySize?: string;
    industry?: string;
  }) => void;
  /** Upload a (compact, downscaled) logo data URL; persisted to S3 when live. */
  uploadWorkspaceLogo: (dataUrl: string) => Promise<void>;
  tasks: Task[];
  projects: Project[];
  members: Member[];
  activity: Activity[];
  notifications: Notification[];
  approvals: Approval[];
  attachments: Attachment[];
  documents: DocFile[];
  /** Upload a document for review: S3 (presigned PUT) then record as a DOC item
      with a reviewer + viewers. Optimistic in demo mode (no S3). */
  uploadDocument: (input: {
    file: File;
    title: string;
    projectId: string;
    reviewerId: string;
    viewerIds: string[];
    description?: string;
  }) => Promise<void>;
  /** Record a reviewer's decision: approve with a typed digital sign-off, or
      request changes with a reason. */
  reviewDocument: (
    id: string,
    decision: "approved" | "rejected",
    opts?: { signature?: string; reason?: string },
  ) => void;
  /** Re-open a rejected document for review (uploader, after making changes). */
  resubmitDocument: (id: string) => void;
  /** Remove a document everywhere + its S3 object / DDB record. */
  removeDocument: (id: string) => void;
  setApprovalStatus: (id: string, status: Approval["status"]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  /**
   * Add freshly-invited people to the workspace store so they appear everywhere
   * (Team page, project team, assignee pickers) immediately — not only after a
   * reload. Persistence is already handled by the invite API; this just keeps
   * the client in sync. `assignments` places each new member onto a project in
   * the given role (mirroring the server's project-team assignment).
   */
  addInvitedMembers: (
    newMembers: Member[],
    assignments: { projectId: string; role: ProjectRole }[],
  ) => void;
  /** Update the signed-in user's own profile (name / photo) everywhere. */
  updateProfile: (patch: { name?: string; avatar?: string }) => void;
  addProject: (p: NewProject) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  columns: Column[];
  /** Columns for a project: the shared defaults + that project's custom columns. */
  columnsForProject: (projectId: string) => Column[];
  collapsed: Set<string>;
  toggleColumn: (id: string) => void;
  addColumn: (name: string, projectId?: string) => void;
  removeColumn: (id: string, projectId?: string) => void;
  renameColumn: (id: string, name: string, projectId: string) => void;
  reorderColumns: (projectId: string, orderedIds: string[]) => void;
  role: Role;
  setRole: (r: Role) => void;
  /** Global/workspace-level permission gate (workspace settings, team page). */
  can: (action: WsAction) => boolean;
  /** Any member who isn't a workspace viewer may create a project (and own it). */
  canCreateProject: boolean;
  /** The signed-in user's role on a specific project (Owner for super-admins). */
  myProjectRole: (projectId: string) => ProjectRole | null;
  /** Per-project permission gate, driven by the user's role on that project. */
  canInProject: (projectId: string, action: WsAction) => boolean;
  addTask: (t: NewTask) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  /** Move a task into the review column (awaiting the reviewer's decision). */
  sendForReview: (id: string) => void;
  /** Record a reviewer's decision: approve (→ Done) or request changes
      (→ In progress) with an optional reason, logged as a comment. */
  reviewTask: (id: string, decision: "approved" | "rejected", note?: string) => void;
  /** Upload files to a task: S3 (presigned PUT) then record as attachments. */
  uploadTaskDocuments: (
    taskId: string,
    projectId: string,
    files: File[],
  ) => Promise<void>;
  /** Upload files to a project (no task): S3 (presigned PUT) then record. */
  uploadProjectDocuments: (projectId: string, files: File[]) => Promise<void>;
  /** Remove an attachment everywhere (Attachments tab + any task) + S3/DDB. */
  removeAttachment: (id: string) => void;
  moveTask: (id: string, column: string) => void;
  selectedId: string | null;
  selectedTask: Task | null;
  openTask: (id: string) => void;
  closeTask: () => void;
};

const Ctx = createContext<WorkspaceCtx | null>(null);

/* Globally-unique optimistic id. A plain incrementing counter resets to its
   start every session, so — now that the API honors the client-provided id —
   the first new item each session would collide with (and overwrite) an
   already-persisted item of the same id (e.g. two `t-1001`). A time+random
   suffix is unique across sessions and stays within the API's id pattern. */
const nextId = (p: string) =>
  `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Compact human-readable file size. */
function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Two-letter initials from a display name. */
function initialsFromName(s: string): string {
  const p = s.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? p[0]?.[1] ?? ""))
    .toUpperCase()
    .slice(0, 2);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [activity, setActivity] = useState<Activity[]>(ACTIVITY);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [approvals, setApprovals] = useState<Approval[]>(APPROVALS);
  const [attachments, setAttachments] = useState<Attachment[]>(ATTACHMENTS);
  const [documents, setDocuments] = useState<DocFile[]>(DOCUMENTS);
  const [columns, setColumns] = useState<Column[]>(
    COLUMNS.map((c) => ({ id: c.id, name: c.name })),
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<Role>("admin");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string>(ME_ID);
  const [me, setMe] = useState<{ id: string; name: string; email: string; role: string }>(
    { id: ME_ID, name: "You", email: "", role: "admin" },
  );
  const [workspace, setWorkspace] = useState<{
    id: string;
    name: string;
    company?: string;
    logo?: string;
    companySize?: string;
    industry?: string;
    plan?: string;
  }>({ id: "", name: "Meridian" });
  // `loading` only blocks when we're actually fetching live data.
  const [loading, setLoading] = useState<boolean>(cognitoConfigured);
  const [live, setLive] = useState<boolean>(false);

  /* Bootstrap the workspace from DynamoDB when Cognito is configured; fall
     back to the built-in seed data otherwise (demo mode). */
  useEffect(() => {
    if (!cognitoConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch("/api/bootstrap");
        if (res.status === 401) {
          // Not signed in — protected pages bounce to login (keep skeleton).
          router.replace("/login");
          return;
        }
        const data = res.ok ? await res.json() : null;
        if (cancelled) return;
        if (!data || data.demo) {
          setLoading(false);
          return; // demo fallback (AWS not configured)
        }
        if (data.needsOnboarding) {
          router.replace("/onboarding");
          return; // keep skeleton until navigation
        }
        const liveColumns: Column[] = (data.columns ?? []).map(
          (c: { id: string; name: string }) => ({ id: c.id, name: c.name }),
        );
        setTasks(data.tasks ?? []);
        setProjects(data.projects ?? []);

        // Self-heal name consistency: the signed-in user's account name (from
        // their token) is the source of truth. If their member record carries
        // a stale name (e.g. the email-derived one from an invite), reconcile
        // it so the same name + avatar show everywhere, and persist the fix.
        const meId: string | undefined = data.me?.id;
        const meName: string =
          (data.me?.name && String(data.me.name).trim()) || data.me?.email || "";
        let membersData: Member[] = data.members ?? [];
        let staleSelf: Member | null = null;
        if (meId && meName) {
          membersData = membersData.map((m) => {
            const mid = m.id === meId || (m as { userId?: string }).userId === meId;
            if (mid && m.name !== meName) {
              staleSelf = m;
              return { ...m, name: meName, initials: initialsFromName(meName) };
            }
            return m;
          });
        }
        setMembers(membersData);
        if (staleSelf) {
          void authedFetch(`/api/members/${(staleSelf as Member).id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: meName,
              initials: initialsFromName(meName),
            }),
          }).catch(() => {});
        }

        setActivity(data.activity ?? []);
        setNotifications(data.notifications ?? []);
        setApprovals(data.approvals ?? []);
        setAttachments(data.attachments ?? []);
        setDocuments(data.documents ?? []);
        if (liveColumns.length) setColumns(liveColumns);
        if (data.workspace) {
          setWorkspace({
            id: data.workspace.id ?? "",
            name: data.workspace.name ?? "Workspace",
            company: data.workspace.company,
            logo: data.workspace.logo,
            companySize: data.workspace.companySize,
            industry: data.workspace.industry,
            plan: data.workspace.plan,
          });
        }
        if (data.me?.id) {
          setMeId(data.me.id);
          setMe({
            id: data.me.id,
            name: data.me.name ?? data.me.email ?? "You",
            email: data.me.email ?? "",
            role: data.me.role ?? "Member",
          });
          // Permissions follow the user's real role.
          setRole(mapRole(data.me.role));
        }
        setLive(true);
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false); // demo fallback on error
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keep the read-only helper store (memberById/projectById/…) in sync with
     whatever data is active. Done SYNCHRONOUSLY during render — not in an
     effect — so lookups are correct on the very first paint after bootstrap.
     An effect updates the store only after commit and doesn't trigger a
     re-render, which left names/avatars (Assignee/Reporter/Reviewer) blank on
     a hard refresh until some unrelated state change happened to repaint. */
  hydrateRuntime({ members, projects, tasks, columns });

  const can = (action: WsAction) =>
    role === "admin" ? true : role === "editor" ? action !== "manage" : false;

  // The signed-in user's real member record id (may differ from their Cognito
  // sub for invited members, whose record is keyed by an invite id).
  const myMemberId = () =>
    members.find((m) => m.id === meId || m.userId === meId)?.id ?? meId;

  const myProjectRole = (projectId: string): ProjectRole | null => {
    // The workspace owner/admin is a super-admin with full control of every
    // project, regardless of the project's own team.
    if (role === "admin") return "Owner";
    const p = projects.find((x) => x.id === projectId);
    if (!p) return null;
    const mid = myMemberId();
    if (p.ownerId === mid) return "Owner";
    if (p.adminIds.includes(mid)) return "Admin";
    if (p.memberIds.includes(mid)) return "Member";
    if (p.viewerIds.includes(mid)) return "Viewer";
    // Access granted only via the personal access list (Team page) is Member.
    if (members.find((m) => m.id === mid)?.projects?.includes(projectId))
      return "Member";
    return null;
  };

  // Per-project permission matrix:
  //   Owner  → everything, including deleting the project
  //   Admin  → everything except deleting the project
  //   Member → work on tasks; can't manage settings/team or delete
  //   Viewer → read-only
  const canInProject = (projectId: string, action: WsAction): boolean => {
    const pr = myProjectRole(projectId);
    switch (pr) {
      case "Owner":
        return true;
      case "Admin":
        return action !== "deleteProject";
      case "Member":
        return action !== "manage" && action !== "deleteProject";
      default:
        return false;
    }
  };

  /* Best-effort persistence — optimistic UI updates already happened. */
  const persist = (input: string, init: RequestInit) => {
    if (live) void authedFetch(input, init).catch(() => {});
  };

  /* A project's columns: its own ordered list once customised, else the shared
     defaults. Mutations materialise the full list onto the project + persist. */
  const baseColumns = (projectId: string): Column[] => {
    const proj = projects.find((p) => p.id === projectId);
    return proj?.columns && proj.columns.length ? proj.columns : columns;
  };
  const persistColumns = (projectId: string, next: Column[]) => {
    setProjects((ps) =>
      ps.map((p) => (p.id === projectId ? { ...p, columns: next } : p)),
    );
    persist(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ columns: next }),
    });
  };

  /* Shared upload pipeline: presign → PUT to S3 → record the ATTACH# item →
     prepend to the shared `attachments` state. `taskId` is optional so the same
     flow backs both task-level and project-level (no task) uploads. Needs a
     live workspace + S3; in demo mode this is a no-op. */
  const uploadDocuments = async (
    projectId: string,
    files: File[],
    taskId?: string,
  ) => {
    if (!live || files.length === 0) return;
    for (const file of files) {
      try {
        const presign = await authedFetch("/api/attachments", {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            ...(taskId ? { taskId } : {}),
          }),
        });
        if (!presign.ok) continue;
        const { uploadUrl, key: objectKey } = await presign.json();
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        const rec = await authedFetch("/api/attachments", {
          method: "PUT",
          body: JSON.stringify({
            key: objectKey,
            name: file.name,
            ext: (file.name.split(".").pop() ?? "").toLowerCase(),
            size: humanSize(file.size),
            projectId,
            ...(taskId ? { taskId } : {}),
          }),
        });
        if (rec.ok) {
          const { attachment } = await rec.json();
          setAttachments((a) => [attachment, ...a]);
        }
      } catch {
        /* best-effort — skip files that fail to upload */
      }
    }
  };

  const value: WorkspaceCtx = {
    loading,
    me,
    workspace,
    updateWorkspace: (patch) => {
      setWorkspace((w) => ({ ...w, ...patch }));
      // Logo goes through the S3-backed route, not the metadata PATCH.
      const { logo, ...meta } = patch;
      void logo;
      if (Object.keys(meta).length) {
        persist("/api/workspace", { method: "PATCH", body: JSON.stringify(meta) });
      }
    },
    uploadWorkspaceLogo: async (dataUrl) => {
      setWorkspace((w) => ({ ...w, logo: dataUrl })); // optimistic compact data URL
      if (!live) return;
      try {
        const res = await authedFetch("/api/workspace/logo", {
          method: "POST",
          body: JSON.stringify({ dataUrl }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.logo) setWorkspace((w) => ({ ...w, logo: json.logo }));
        }
      } catch {
        /* keep the optimistic data URL for this session */
      }
    },
    tasks,
    projects,
    members,
    activity,
    notifications,
    approvals,
    attachments,
    documents,
    uploadDocument: async (input) => {
      const today = new Date().toISOString().slice(0, 10);
      const ext = (input.file.name.split(".").pop() ?? "").toLowerCase();
      const base: Omit<DocFile, "id"> = {
        title: input.title.trim() || input.file.name,
        name: input.file.name,
        ext,
        size: humanSize(input.file.size),
        projectId: input.projectId,
        uploadedById: myMemberId(),
        reviewerId: input.reviewerId,
        viewerIds: input.viewerIds,
        status: "pending",
        date: today,
        createdAt: Date.now(),
        ...(input.description ? { description: input.description } : {}),
      };
      // Demo mode (no S3/live): keep an optimistic local record so the flow is
      // fully usable locally — only download/preview needs the live backend.
      if (!live) {
        setDocuments((d) => [{ id: nextId("doc"), ...base }, ...d]);
        return;
      }
      try {
        const presign = await authedFetch("/api/documents", {
          method: "POST",
          body: JSON.stringify({
            filename: input.file.name,
            contentType: input.file.type,
          }),
        });
        if (!presign.ok) return;
        const { uploadUrl, key: objectKey } = await presign.json();
        await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": input.file.type || "application/octet-stream",
          },
          body: input.file,
        });
        const rec = await authedFetch("/api/documents", {
          method: "PUT",
          body: JSON.stringify({
            key: objectKey,
            name: input.file.name,
            title: base.title,
            ext,
            size: base.size,
            projectId: input.projectId,
            reviewerId: input.reviewerId,
            viewerIds: input.viewerIds,
            description: input.description,
          }),
        });
        if (rec.ok) {
          const { document } = await rec.json();
          setDocuments((d) => [document, ...d]);
        }
      } catch {
        /* best-effort — skip a file that fails to upload */
      }
    },
    reviewDocument: (id, decision, opts) => {
      const patch: Partial<DocFile> =
        decision === "approved"
          ? {
              status: "approved",
              reviewedById: myMemberId(),
              reviewedAt: Date.now(),
              signature: opts?.signature ?? "",
              rejectReason: "",
            }
          : {
              status: "rejected",
              reviewedById: myMemberId(),
              reviewedAt: Date.now(),
              rejectReason: opts?.reason ?? "",
              signature: "",
            };
      setDocuments((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      persist(`/api/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(
          decision === "approved"
            ? { status: "approved", signature: opts?.signature }
            : { status: "rejected", reason: opts?.reason },
        ),
      });
    },
    resubmitDocument: (id) => {
      const patch: Partial<DocFile> = {
        status: "pending",
        reviewedById: undefined,
        reviewedAt: undefined,
        signature: "",
        rejectReason: "",
      };
      setDocuments((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      persist(`/api/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "pending" }),
      });
    },
    removeDocument: (id) => {
      setDocuments((d) => d.filter((x) => x.id !== id));
      persist(`/api/documents/${id}`, { method: "DELETE" });
    },
    setApprovalStatus: (id, status) => {
      setApprovals((list) =>
        list.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      persist(`/api/approvals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    markNotificationRead: (id) => {
      setNotifications((list) =>
        list.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      );
      persist(`/api/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ unread: false }),
      });
    },
    markAllNotificationsRead: () => {
      const wasUnread = notifications.filter((n) => n.unread);
      setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
      wasUnread.forEach((n) =>
        persist(`/api/notifications/${n.id}`, {
          method: "PATCH",
          body: JSON.stringify({ unread: false }),
        }),
      );
    },
    removeMember: (id) => {
      setMembers((ms) => ms.filter((m) => m.id !== id));
      persist(`/api/members/${id}`, { method: "DELETE" });
    },
    updateMember: (id, patch) => {
      setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
      persist(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    addInvitedMembers: (newMembers, assignments) => {
      // Skip anyone already in the workspace (resends, or a person invited from
      // two places at once) — match on email so we never create a duplicate row.
      const known = new Set(members.map((m) => m.email.toLowerCase()));
      const fresh = newMembers.filter(
        (m) => !known.has(m.email.toLowerCase()),
      );
      if (fresh.length === 0) return;
      const freshIds = fresh.map((m) => m.id);
      setMembers((ms) => [...ms, ...fresh]);
      // Place the new members onto each assigned project's team, keeping the
      // role arrays mutually exclusive (mirrors the invite API's assignment).
      if (assignments.length) {
        setProjects((ps) =>
          ps.map((p) => {
            const a = assignments.find((x) => x.projectId === p.id);
            if (!a) return p;
            const strip = (arr: string[] = []) =>
              arr.filter((x) => !freshIds.includes(x));
            const next: Project = {
              ...p,
              adminIds: strip(p.adminIds),
              memberIds: strip(p.memberIds),
              viewerIds: strip(p.viewerIds),
            };
            const field =
              a.role === "Admin"
                ? "adminIds"
                : a.role === "Viewer"
                  ? "viewerIds"
                  : "memberIds";
            next[field] = [...next[field], ...freshIds];
            return next;
          }),
        );
      }
      // No persist() here: the invite API already created the member records and
      // assigned them to their projects server-side.
    },
    updateProfile: (patch) => {
      // Reflect immediately in the topbar/greeting and the members list…
      if (patch.name !== undefined) {
        setMe((m) => ({ ...m, name: patch.name as string }));
      }
      setMembers((ms) =>
        ms.map((m) =>
          m.id === meId || m.userId === meId ? { ...m, ...patch } : m,
        ),
      );
      // …and persist to this user's own member record. Send the sub so the
      // route's self-edit check (id === caller sub) passes; it resolves the
      // real (possibly invite-keyed) record server-side.
      persist(`/api/members/${meId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    addProject: (p) => {
      // The creator is the project's owner — full access, no need to grant
      // themselves anything. Use their real MEMBER id (which may differ from
      // their Cognito sub for invited users) so the project's team arrays match
      // how members are keyed. Other teammates are added with the chosen role,
      // with the owner removed from those arrays so roles stay exclusive.
      const ownerId = myMemberId();
      const without = (ids: string[] = []) =>
        ids.filter((x) => x && x !== ownerId);
      const project: Project = {
        id: nextId("p"),
        name: p.name.trim() || "Untitled project",
        key: (p.key.trim() || p.name.slice(0, 4)).toUpperCase().slice(0, 6),
        color: p.color,
        progress: 0,
        status: "On track",
        open: 0,
        ownerId,
        adminIds: without(p.adminIds),
        memberIds: without(p.memberIds),
        viewerIds: without(p.viewerIds),
        ...(p.description ? { description: p.description } : {}),
      };
      setProjects((ps) => [...ps, project]);
      // Reflect the new project in every added member's access list (incl. the
      // owner) for this session, so it shows immediately.
      const onProject = new Set([
        ownerId,
        ...project.adminIds,
        ...project.memberIds,
        ...project.viewerIds,
      ]);
      setMembers((ms) =>
        ms.map((m) =>
          onProject.has(m.id)
            ? {
                ...m,
                projects: Array.from(
                  new Set([...(m.projects ?? []), project.id]),
                ),
              }
            : m,
        ),
      );
      persist("/api/projects", { method: "POST", body: JSON.stringify(project) });
    },
    updateProject: (id, patch) => {
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      persist(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    },
    deleteProject: (id) => {
      setProjects((ps) => ps.filter((x) => x.id !== id));
      // Scrub every dangling reference so nothing points at a project that no
      // longer exists: members' personal access lists, and the project's tasks,
      // approvals, and attachments (the server mirrors this cleanup).
      setMembers((ms) =>
        ms.map((m) =>
          m.projects?.includes(id)
            ? { ...m, projects: m.projects.filter((p) => p !== id) }
            : m,
        ),
      );
      setTasks((ts) => ts.filter((t) => t.projectId !== id));
      setApprovals((a) => a.filter((x) => x.projectId !== id));
      setAttachments((a) => a.filter((x) => x.projectId !== id));
      setDocuments((d) => d.filter((x) => x.projectId !== id));
      persist(`/api/projects/${id}`, { method: "DELETE" });
    },
    columns,
    collapsed,
    toggleColumn: (id) =>
      setCollapsed((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    columnsForProject: (projectId) => baseColumns(projectId),
    addColumn: (name, projectId) => {
      const col = { id: nextId("col"), name: name.trim() || "New column" };
      if (!projectId) {
        setColumns((c) => [...c, col]);
        return;
      }
      persistColumns(projectId, [...baseColumns(projectId), col]);
    },
    removeColumn: (id, projectId) => {
      if (!projectId) {
        setColumns((c) => c.filter((x) => x.id !== id));
        return;
      }
      persistColumns(
        projectId,
        baseColumns(projectId).filter((c) => c.id !== id),
      );
    },
    renameColumn: (id, name, projectId) => {
      const clean = name.trim();
      if (!clean) return;
      persistColumns(
        projectId,
        baseColumns(projectId).map((c) =>
          c.id === id ? { ...c, name: clean } : c,
        ),
      );
    },
    reorderColumns: (projectId, orderedIds) => {
      const cols = baseColumns(projectId);
      const byId = new Map(cols.map((c) => [c.id, c]));
      const next = orderedIds
        .map((id) => byId.get(id))
        .filter((c): c is Column => Boolean(c));
      // keep any columns not present in the ordered list (safety)
      for (const c of cols) if (!orderedIds.includes(c.id)) next.push(c);
      persistColumns(projectId, next);
    },
    role,
    setRole,
    can,
    canCreateProject: role !== "viewer",
    myProjectRole,
    canInProject,
    addTask: (t) => {
      const task: Task = {
        id: nextId("t"),
        title: t.title.trim() || "Untitled task",
        column: t.column,
        priority: t.priority ?? "Medium",
        ticketType: t.ticketType ?? "Task",
        assigneeId: t.assigneeId ?? t.assigneeIds?.[0] ?? meId,
        assigneeIds:
          t.assigneeIds && t.assigneeIds.length
            ? t.assigneeIds
            : [t.assigneeId ?? meId],
        projectId: t.projectId,
        due: t.due ?? "—",
        tag: t.tag ?? "Task",
        tagColor: t.tagColor ?? "#2563eb",
        createdById: meId,
        description: t.description ?? "",
        subtasks: t.subtasks ?? [],
        comments: [],
        ...(t.startDate ? { startDate: t.startDate } : {}),
        ...(t.reviewerId ? { reviewerId: t.reviewerId } : {}),
      };
      setTasks((ts) => [...ts, task]);
      if (live) {
        void authedFetch("/api/tasks", {
          method: "POST",
          body: JSON.stringify(task),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            // Reconcile the optimistic id with the server-generated one.
            if (d?.task?.id && d.task.id !== task.id) {
              setTasks((ts) =>
                ts.map((x) => (x.id === task.id ? { ...x, id: d.task.id } : x)),
              );
            }
          })
          .catch(() => {});
      }
      return task;
    },
    updateTask: (id, patch) => {
      setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      persist(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    },
    deleteTask: (id) => {
      setTasks((ts) => ts.filter((x) => x.id !== id));
      // A task's attached documents go with it — drop them from the shared
      // attachments state so they disappear from the Attachments tab right
      // away. The server cascade-deletes the records + S3 objects (DELETE route).
      setAttachments((a) => a.filter((x) => x.taskId !== id));
      setSelectedId((s) => (s === id ? null : s));
      persist(`/api/tasks/${id}`, { method: "DELETE" });
    },
    sendForReview: (id) => {
      const patch = { column: "review", reviewStatus: "pending" as const };
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      persist(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    reviewTask: (id, decision, note) => {
      const t = tasks.find((x) => x.id === id);
      const approved = decision === "approved";
      // Log the decision as a comment so the task's history reads naturally.
      const comment: Comment = {
        id: nextId("c"),
        authorId: myMemberId(),
        text: approved
          ? "Approved this task."
          : `Requested changes${note ? `: ${note}` : "."}`,
        at: Date.now(),
      };
      const comments = [...(t?.comments ?? []), comment];
      const patch: Partial<Task> = {
        column: approved ? "done" : "in_progress",
        reviewStatus: decision,
        reviewedById: myMemberId(),
        reviewedAt: Date.now(),
        comments,
        ...(note ? { reviewNote: note } : {}),
      };
      setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      persist(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },
    uploadTaskDocuments: (taskId, projectId, files) =>
      uploadDocuments(projectId, files, taskId),
    uploadProjectDocuments: (projectId, files) =>
      uploadDocuments(projectId, files),
    removeAttachment: (id) => {
      setAttachments((a) => a.filter((x) => x.id !== id));
      persist(`/api/attachments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    moveTask: (id, column) => {
      setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, column } : x)));
      persist(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ column }) });
    },
    selectedId,
    selectedTask: tasks.find((t) => t.id === selectedId) ?? null,
    // Tasks open as a full page so the same rich view shows from every tab.
    openTask: (id) => router.push(`/app/tasks/${id}`),
    closeTask: () => setSelectedId(null),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return c;
}
