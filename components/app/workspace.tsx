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
  MEMBERS,
  ME_ID,
  NOTIFICATIONS,
  PROJECTS,
  TASKS,
  hydrateRuntime,
  type Activity,
  type Approval,
  type Attachment,
  type Member,
  type Notification,
  type Priority,
  type Project,
  type Task,
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
export type WsAction = "create" | "edit" | "delete" | "assign" | "manage";

export type NewTask = {
  title: string;
  column: string;
  projectId: string;
  assigneeId?: string;
  assigneeIds?: string[];
  priority?: Priority;
  tag?: string;
  tagColor?: string;
  due?: string;
  startDate?: string;
  reviewerId?: string;
};

export type NewProject = {
  name: string;
  key: string;
  color: string;
  description?: string;
  leadIds: string[];
  reviewerIds: string[];
  memberIds: string[];
};

type WorkspaceCtx = {
  loading: boolean;
  me: { id: string; name: string; email: string; role: string };
  workspace: { id: string; name: string; company?: string; logo?: string };
  updateWorkspace: (patch: { name?: string; company?: string; logo?: string }) => void;
  /** Upload a (compact, downscaled) logo data URL; persisted to S3 when live. */
  uploadWorkspaceLogo: (dataUrl: string) => Promise<void>;
  tasks: Task[];
  projects: Project[];
  members: Member[];
  activity: Activity[];
  notifications: Notification[];
  approvals: Approval[];
  attachments: Attachment[];
  addProject: (p: NewProject) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  columns: Column[];
  collapsed: Set<string>;
  toggleColumn: (id: string) => void;
  addColumn: (name: string) => void;
  removeColumn: (id: string) => void;
  role: Role;
  setRole: (r: Role) => void;
  can: (action: WsAction) => boolean;
  addTask: (t: NewTask) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, column: string) => void;
  selectedId: string | null;
  selectedTask: Task | null;
  openTask: (id: string) => void;
  closeTask: () => void;
};

const Ctx = createContext<WorkspaceCtx | null>(null);

let seq = 1000;
const nextId = (p: string) => `${p}-${++seq}`;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [activity, setActivity] = useState<Activity[]>(ACTIVITY);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);
  const [approvals, setApprovals] = useState<Approval[]>(APPROVALS);
  const [attachments, setAttachments] = useState<Attachment[]>(ATTACHMENTS);
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
        setMembers(data.members ?? []);
        setActivity(data.activity ?? []);
        setNotifications(data.notifications ?? []);
        setApprovals(data.approvals ?? []);
        setAttachments(data.attachments ?? []);
        if (liveColumns.length) setColumns(liveColumns);
        if (data.workspace) {
          setWorkspace({
            id: data.workspace.id ?? "",
            name: data.workspace.name ?? "Workspace",
            company: data.workspace.company,
            logo: data.workspace.logo,
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
     whatever data is active, in both demo and live mode. */
  useEffect(() => {
    hydrateRuntime({ members, projects, tasks, columns });
  }, [members, projects, tasks, columns]);

  const can = (action: WsAction) =>
    role === "admin" ? true : role === "editor" ? action !== "manage" : false;

  /* Best-effort persistence — optimistic UI updates already happened. */
  const persist = (input: string, init: RequestInit) => {
    if (live) void authedFetch(input, init).catch(() => {});
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
    addProject: (p) => {
      const project: Project = {
        id: nextId("p"),
        name: p.name.trim() || "Untitled project",
        key: (p.key.trim() || p.name.slice(0, 4)).toUpperCase().slice(0, 6),
        color: p.color,
        progress: 0,
        status: "On track",
        open: 0,
        leadIds: p.leadIds,
        reviewerIds: p.reviewerIds,
        memberIds: Array.from(
          new Set([...p.memberIds, ...p.leadIds, ...p.reviewerIds]),
        ),
        ...(p.description ? { description: p.description } : {}),
      };
      setProjects((ps) => [...ps, project]);
      persist("/api/projects", { method: "POST", body: JSON.stringify(project) });
    },
    updateProject: (id, patch) => {
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      persist(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    },
    deleteProject: (id) => {
      setProjects((ps) => ps.filter((x) => x.id !== id));
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
    addColumn: (name) =>
      setColumns((c) => [...c, { id: nextId("col"), name: name.trim() || "New column" }]),
    removeColumn: (id) => setColumns((c) => c.filter((x) => x.id !== id)),
    role,
    setRole,
    can,
    addTask: (t) => {
      const task: Task = {
        id: nextId("t"),
        title: t.title.trim() || "Untitled task",
        column: t.column,
        priority: t.priority ?? "Medium",
        assigneeId: t.assigneeId ?? t.assigneeIds?.[0] ?? meId,
        assigneeIds:
          t.assigneeIds && t.assigneeIds.length
            ? t.assigneeIds
            : [t.assigneeId ?? meId],
        projectId: t.projectId,
        due: t.due ?? "—",
        tag: t.tag ?? "Task",
        tagColor: t.tagColor ?? "#2563eb",
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
      setSelectedId((s) => (s === id ? null : s));
      persist(`/api/tasks/${id}`, { method: "DELETE" });
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
