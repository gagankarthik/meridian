"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Columns3,
  GanttChartSquare,
  LayoutDashboard,
  Paperclip,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Table2,
  Users,
  X,
} from "lucide-react";
import {
  COLUMN_LABEL,
  memberById,
  priorityMeta,
  projectMemberIds,
  type Priority,
} from "@/lib/app-data";
import { MemberAvatar, ProjectAvatar, StatusChip } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

type ViewId =
  | "summary"
  | "board"
  | "table"
  | "timeline"
  | "approvals"
  | "attachments"
  | "team"
  | "settings";

const TABS = [
  { id: "summary", label: "Overview", href: "/app/summary", icon: LayoutDashboard },
  { id: "board", label: "Board", href: "/app/board", icon: Columns3 },
  { id: "table", label: "Table", href: "/app/table", icon: Table2 },
  { id: "timeline", label: "Timeline", href: "/app/timeline", icon: GanttChartSquare },
  { id: "approvals", label: "Approvals", href: "/app/approvals", icon: CheckCircle2 },
  { id: "attachments", label: "Attachments", href: "/app/attachments", icon: Paperclip },
  { id: "team", label: "Team", href: "/app/project-team", icon: Users },
  { id: "settings", label: "Settings", href: "/app/project-settings", icon: Settings },
] as const;

const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];

export function ProjectViewHeader({
  current,
  projectId,
  toolbar,
}: {
  current: ViewId;
  projectId: string;
  /** Optional controls rendered at the right end of the tabs row (e.g. the
      Board's own filter). When omitted, a project-wide search + filter shows
      there instead — so the space is never just an empty scroll track. */
  toolbar?: ReactNode;
}) {
  const ws = useWorkspace();
  const project =
    ws.projects.find((p) => p.id === projectId) ?? ws.projects[0];
  const memberIds = project ? projectMemberIds(project.id) : [];
  const team = memberIds
    .map((id) => memberById(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .slice(0, 4);
  const overflow = Math.max(0, memberIds.length - team.length);
  const q = project ? `?project=${project.id}` : "";

  return (
    <div className="border-b border-line bg-paper">
      {/* title row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProjectAvatar seed={project?.name ?? "project"} size={28} rounded="rounded-lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate font-display text-[18px] font-extrabold tracking-tight text-ink">
                {project?.name ?? "No project"}
              </h1>
              {project && <StatusChip status={project.status} />}
            </div>
            {project?.description && (
              <p className="mt-0.5 max-w-xl truncate text-[12.5px] text-ink-muted">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {team.length > 0 && (
            <div className="hidden -space-x-2 sm:flex">
              {team.map((m) => (
                <span key={m.id} className="rounded-full ring-2 ring-paper" title={m.name}>
                  <MemberAvatar member={m} size={26} />
                </span>
              ))}
              {overflow > 0 && (
                <span className="grid size-[26px] place-items-center rounded-full bg-secondary text-[10px] font-bold text-ink-muted ring-2 ring-paper">
                  +{overflow}
                </span>
              )}
            </div>
          )}
          <Link
            href={`/app/tasks/new${q}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-signal px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add task</span>
          </Link>
        </div>
      </div>

      {/* tabs + right-aligned project search / filter */}
      <div className="mt-2 flex items-center gap-3 px-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const active = t.id === current;
            return (
              <Link
                key={t.id}
                href={`${t.href}${q}`}
                className={cn(
                  "relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <t.icon className="size-3.5" />
                {t.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-signal" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2.5 py-1.5">
          {toolbar ?? (project && <ProjectSearchFilter projectId={project.id} />)}
        </div>
      </div>
    </div>
  );
}

/* Project-wide task finder shown at the right end of the tab strip. Searches
   the whole project's tasks and narrows by priority / status; selecting a
   result opens the task. Self-contained — it never touches per-tab state. */
function ProjectSearchFilter({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const [q, setQ] = useState("");
  const [resultsOpen, setResultsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priorities, setPriorities] = useState<Set<Priority>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setResultsOpen(false);
        setFilterOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const projectTasks = useMemo(
    () => ws.tasks.filter((t) => t.projectId === projectId),
    [ws.tasks, projectId],
  );
  const activeFilters = priorities.size + statuses.size;

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return projectTasks
      .filter((t) => {
        if (query && !t.title.toLowerCase().includes(query)) return false;
        if (priorities.size && !priorities.has(t.priority)) return false;
        if (statuses.size && !statuses.has(t.column)) return false;
        return true;
      })
      .slice(0, 8);
  }, [projectTasks, q, priorities, statuses]);

  const togglePriority = (p: Priority) =>
    setPriorities((s) => {
      const n = new Set(s);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  const toggleStatus = (id: string) =>
    setStatuses((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const clearFilters = () => {
    setPriorities(new Set());
    setStatuses(new Set());
  };

  const showResults = resultsOpen && (q.trim().length > 0 || activeFilters > 0);

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {/* search */}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-ink-soft transition-colors focus-within:border-signal/40">
        <Search className="size-3.5 shrink-0" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setResultsOpen(true);
          }}
          onFocus={() => setResultsOpen(true)}
          placeholder="Search this project…"
          className="w-28 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-soft sm:w-44"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="shrink-0 text-ink-soft hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* filter */}
      <button
        type="button"
        onClick={() => {
          setFilterOpen((v) => !v);
          setResultsOpen(false);
        }}
        aria-expanded={filterOpen}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors",
          activeFilters > 0
            ? "border-signal/40 bg-signal-soft text-signal"
            : "border-line bg-card text-ink-muted hover:text-ink",
        )}
      >
        <SlidersHorizontal className="size-3.5" />
        <span className="hidden sm:inline">Filter</span>
        {activeFilters > 0 && (
          <span className="tnum grid size-4 place-items-center rounded-full bg-signal text-[10px] font-bold text-white">
            {activeFilters}
          </span>
        )}
      </button>

      {/* results dropdown */}
      {showResults && (
        <div className="absolute right-0 top-full z-[80] mt-2 w-72 max-w-[80vw] overflow-hidden rounded-xl border border-line bg-popover p-1.5 shadow-float">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12.5px] text-ink-soft">
              No matching tasks in this project.
            </p>
          ) : (
            results.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setResultsOpen(false);
                  setQ("");
                  router.push(`/app/tasks/${t.id}`);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: t.tagColor }}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                  {t.title}
                </span>
                <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft">
                  {COLUMN_LABEL[t.column] ?? t.column}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* filter popover */}
      {filterOpen && (
        <div className="absolute right-0 top-full z-[80] mt-2 w-64 rounded-xl border border-line bg-popover p-3 shadow-float">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              Priority
            </span>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-semibold text-signal hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => {
              const on = priorities.has(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
                    on
                      ? "border-signal bg-signal-soft text-signal"
                      : "border-line bg-card text-ink-muted hover:bg-secondary",
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: priorityMeta[p].color }}
                  />
                  {p}
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-line pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              Status
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ws.columns.map((c) => {
                const on = statuses.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleStatus(c.id)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
                      on
                        ? "border-signal bg-signal-soft text-signal"
                        : "border-line bg-card text-ink-muted hover:bg-secondary",
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
