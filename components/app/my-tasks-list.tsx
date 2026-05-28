"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Flag, Search, X } from "lucide-react";
import {
  COLUMN_LABEL,
  priorityMeta,
  projectById,
  type Task,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { AvatarStack, ProgressBar, ProjectAvatar, StatusChip } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

type TabId = "assigned" | "created" | "all";

const EMPTY_STATE: Record<TabId, string> = {
  assigned: "Nothing assigned to you yet.",
  created: "You haven't created any tasks yet.",
  all: "Nothing assigned to or created by you yet.",
};

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const TAB_IDS: TabId[] = ["assigned", "created", "all"];

export function MyTasksList({ mode }: { mode?: "assigned" | "created" }) {
  const ws = useWorkspace();
  const meId = ws.me.id;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The active tab is URL-driven (?view=assigned|created|all) so it's shareable,
  // the back button works, and the sidebar deep-links cleanly. `mode` is the
  // fallback for any legacy entry point that doesn't pass a view.
  const viewParam = searchParams.get("view");
  const tab: TabId = TAB_IDS.includes(viewParam as TabId)
    ? (viewParam as TabId)
    : mode ?? "assigned";
  const setTab = (id: TabId) =>
    router.replace(`${pathname}?view=${id}`, { scroll: false });

  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");

  const isAssigned = (t: Task) =>
    t.assigneeIds.includes(meId) || t.assigneeId === meId;
  // New tasks record their real creator. Tasks created before that field
  // existed have no `createdById`, so fall back to "you're the primary
  // assignee" (a safe proxy — no false positives) so your work still surfaces.
  const isCreated = (t: Task) =>
    t.createdById ? t.createdById === meId : t.assigneeId === meId;

  // Tab counts reflect the real number of tasks in each grouping (ignoring the
  // status/search filters, which narrow *within* a tab).
  const tabs: { id: TabId; label: string; count: number; tasks: Task[] }[] = useMemo(() => {
    const assigned = ws.tasks.filter(isAssigned);
    const created = ws.tasks.filter(isCreated);
    // "All" = union of both, de-duplicated by id (preserve task order).
    const seen = new Set<string>();
    const all = ws.tasks.filter((t) => {
      if (!isAssigned(t) && !isCreated(t)) return false;
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    return [
      { id: "assigned", label: "Assigned to me", count: assigned.length, tasks: assigned },
      { id: "created", label: "Created by me", count: created.length, tasks: created },
      { id: "all", label: "All", count: all.length, tasks: all },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.tasks, meId]);

  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  const baseTasks = active.tasks;

  // Status + search filters apply on top of the selected tab.
  const q = query.trim().toLowerCase();
  const tasks = useMemo(
    () =>
      baseTasks.filter(
        (t) =>
          (status === "all" || t.column === status) &&
          (!q ||
            t.title.toLowerCase().includes(q) ||
            (projectById(t.projectId)?.name ?? "").toLowerCase().includes(q)),
      ),
    [baseTasks, status, q],
  );

  // Stats reflect the selected tab (before status/search narrowing) so the
  // overview stays stable as you search.
  const total = baseTasks.length;
  const done = baseTasks.filter((t) => t.column === "done").length;
  const inProgress = baseTasks.filter((t) => t.column === "in_progress").length;
  const dueSoon = baseTasks.filter((t) => t.column !== "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
        {total} task{total === 1 ? "" : "s"}
      </p>
      <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
        My tasks
      </h1>

      {/* tabs — segmented control styled like the app's other tab pills */}
      <div className="mt-5 inline-flex items-center gap-1 rounded-xl border border-line bg-card p-1">
        {tabs.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                isActive
                  ? "bg-signal-soft text-signal-strong"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "tnum text-[11px] font-bold",
                  isActive ? "text-signal-strong" : "text-ink-soft",
                )}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total" value={total} />
        <StatTile label="Completed" value={done} accent="#1f9d6b" />
        <StatTile label="In progress" value={inProgress} accent="#2f6df0" />
        <StatTile label="Due soon" value={dueSoon} accent="#d9842b" />
      </div>

      {/* progress */}
      <div className="mt-3 rounded-2xl border border-line bg-card p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink-soft">
            Overall progress
          </span>
          <span className="tnum text-[12px] font-semibold text-ink">
            {pct}% done
          </span>
        </div>
        <ProgressBar value={pct} />
        <p className="tnum mt-2 text-[11px] text-ink-soft">
          {done} of {total} complete
        </p>
      </div>

      {/* toolbar: search + status filter (apply within the selected tab) */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="w-full rounded-xl border border-line bg-card py-1.5 pr-8 pl-8 text-[13px] text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid size-4 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-1">
          {STATUS_FILTERS.map((f) => {
            const isActive = status === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatus(f.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-colors",
                  isActive
                    ? "bg-signal-soft text-signal-strong"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        {baseTasks.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-ink-soft">
            {EMPTY_STATE[active.id]}
          </p>
        ) : tasks.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-ink-soft">
            No tasks match your filters.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {tasks.map((t) => {
              const project = projectById(t.projectId);
              const pr = priorityMeta[t.priority];
              return (
                <button
                  key={t.id}
                  onClick={() => ws.openTask(t.id)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-paper-raised sm:px-5"
                >
                  <ProjectAvatar
                    seed={project?.name ?? "project"}
                    size={28}
                    rounded="rounded-md"
                    className="hidden sm:inline-block"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">
                      {t.title}
                    </span>
                    <span className="text-[12px] text-ink-soft">{project?.name}</span>
                  </span>
                  <span className="hidden sm:block">
                    <StatusChip status={COLUMN_LABEL[t.column] ?? t.column} />
                  </span>
                  <span
                    className="hidden items-center gap-1.5 text-[12.5px] font-semibold sm:inline-flex"
                    style={{ color: pr.color }}
                  >
                    <Flag className="size-3.5" style={{ fill: pr.color, color: pr.color }} />
                    {t.priority}
                  </span>
                  <AvatarStack ids={t.assigneeIds} size={24} />
                  <span className="tnum hidden w-28 text-right text-[12px] text-ink-soft md:block">
                    {t.due}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <span className="text-[12px] font-semibold text-ink-soft">{label}</span>
      <p
        className={
          "tnum mt-3 font-display text-[1.75rem] leading-none font-extrabold tracking-tight" +
          (accent ? "" : " text-ink")
        }
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
