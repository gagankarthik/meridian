"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  differenceInCalendarMonths,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { Calendar, Check, ChevronDown, Users } from "lucide-react";
import {
  COLUMN_LABEL,
  memberById,
  projectById,
  type Task,
} from "@/lib/app-data";
import { AvatarStack } from "@/components/app/widgets";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

/* ── Constants ──────────────────────────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  backlog: "#8b909c",
  todo: "#2563eb",
  in_progress: "#e2a200",
  review: "#7a3ff0",
  done: "#22a06b",
};
const FALLBACK_COLOR = "#2563eb";
const statusColor = (column: string) => STATUS_COLOR[column] ?? FALLBACK_COLOR;

/* Default progress per status when a task has no subtasks to measure. */
const STATUS_PCT: Record<string, number> = {
  backlog: 0,
  todo: 10,
  in_progress: 50,
  review: 80,
  done: 100,
};

type Scale = "Week" | "Month" | "Quarter";
const SCALES: Scale[] = ["Week", "Month", "Quarter"];
/* Per-month column width (px) for each scale. */
const SCALE_WIDTH: Record<Scale, number> = { Week: 300, Month: 150, Quarter: 60 };

const ROW_H = 48; // px per task row

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Parse a stored date string; returns null for empty / "—" / invalid input. */
function toDate(s: string | undefined): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed || trimmed === "—") return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Completion percentage for a task: from subtasks if any, else by status. */
function progressPct(t: Task): number {
  const subs = t.subtasks ?? [];
  if (subs.length) {
    const done = subs.filter((s) => s.done).length;
    return Math.round((done / subs.length) * 100);
  }
  return STATUS_PCT[t.column] ?? 0;
}

type Span = { task: Task; start: Date; end: Date };

/* ── Component ──────────────────────────────────────────────────────────── */

export function TimelineClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const project = projectById(projectId);
  const columns = ws.columnsForProject(projectId);

  // Toolbar state.
  const [scale, setScale] = useState<Scale>("Month");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [assignee, setAssignee] = useState<string | null>(null);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const colW = SCALE_WIDTH[scale];

  // Dynamic widths derive from the current date — render after mount so the
  // server markup (which can't know "today") never mismatches the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const assigneeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Close the assignee popover on outside click.
  useEffect(() => {
    if (!assigneeOpen) return;
    const onDown = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [assigneeOpen]);

  // Every assignee that appears on this project's tasks (for the dropdown).
  const assigneeOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const t of ws.tasks) {
      if (t.projectId !== projectId) continue;
      for (const id of t.assigneeIds) ids.add(id);
    }
    return Array.from(ids)
      .map((id) => memberById(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ws.tasks, projectId]);

  // Tasks for this project that pass the status + assignee filters, as dated
  // spans sorted by start ascending.
  const spans = useMemo<Span[]>(() => {
    const today = new Date();
    return ws.tasks
      .filter((t) => {
        if (t.projectId !== projectId) return false;
        if (statusFilter.size && !statusFilter.has(t.column)) return false;
        if (assignee && !t.assigneeIds.includes(assignee)) return false;
        return true;
      })
      .map((t) => {
        const start = toDate(t.startDate) ?? today;
        let end = toDate(t.due) ?? start;
        if (end < start) end = start;
        return { task: t, start, end };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [ws.tasks, projectId, statusFilter, assignee]);

  // Month range: a month of padding either side of the data, always covering
  // today so the "Today" marker has somewhere to live.
  const { months, rangeStart } = useMemo(() => {
    const today = new Date();
    let min = today;
    let max = today;
    for (const s of spans) {
      if (s.start < min) min = s.start;
      if (s.end > max) max = s.end;
    }
    const start = startOfMonth(addMonths(min, -1));
    const end = endOfMonth(addMonths(max, 1));
    return { months: eachMonthOfInterval({ start, end }), rangeStart: start };
  }, [spans]);

  const canvasWidth = months.length * colW;

  // Fractional x-offset (px) of a date within the uniform month grid.
  const dateX = (d: Date) =>
    (differenceInCalendarMonths(d, rangeStart) +
      (d.getDate() - 1) / getDaysInMonth(d)) *
    colW;

  const toggleStatus = (id: string) =>
    setStatusFilter((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Scroll the canvas so today's marker is comfortably in view.
  const scrollToToday = () => {
    const el = canvasRef.current;
    if (!el) return;
    const x = dateX(new Date());
    el.scrollTo({ left: Math.max(0, x - el.clientWidth / 2), behavior: "smooth" });
  };

  if (!mounted) {
    return (
      <div className="flex h-full flex-col bg-paper">
        <ProjectViewHeader current="timeline" projectId={projectId} />
        <div className="min-h-0 flex-1 p-4 sm:p-5">
          <div className="h-full animate-pulse rounded-2xl border border-line bg-paper-raised" />
        </div>
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="flex h-full flex-col bg-paper">
      <ProjectViewHeader current="timeline" projectId={projectId} />

      {spans.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-items-center p-10 text-center text-[13px] text-ink-soft">
          No scheduled work in {project?.name ?? "this project"} yet.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          {/* ── Toolbar ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Scale segmented control */}
            <div
              role="group"
              aria-label="Timeline scale"
              className="inline-flex items-center rounded-lg border border-line bg-card p-0.5"
            >
              {SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={scale === s}
                  onClick={() => setScale(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors",
                    scale === s
                      ? "bg-signal text-white"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {columns.map((c) => {
                const on = statusFilter.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleStatus(c.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
                      on
                        ? "border-signal bg-signal-soft text-signal"
                        : "border-line bg-card text-ink-muted hover:bg-secondary",
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ background: statusColor(c.id) }}
                    />
                    {c.name}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Assignee dropdown */}
              <div ref={assigneeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAssigneeOpen((v) => !v)}
                  aria-expanded={assigneeOpen}
                  aria-label="Filter by assignee"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                    assignee
                      ? "border-signal bg-signal-soft text-signal"
                      : "border-line bg-card text-ink-muted hover:text-ink",
                  )}
                >
                  <Users className="size-3.5" />
                  <span className="max-w-[8rem] truncate">
                    {assignee ? memberById(assignee)?.name ?? "Assignee" : "Anyone"}
                  </span>
                  <ChevronDown className="size-3.5" />
                </button>
                {assigneeOpen && (
                  <div className="absolute right-0 top-full z-[80] mt-2 max-h-72 w-56 overflow-auto rounded-xl border border-line bg-popover p-1.5 shadow-float">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignee(null);
                        setAssigneeOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition-colors hover:bg-secondary"
                    >
                      Anyone
                      {!assignee && <Check className="size-3.5 text-signal" />}
                    </button>
                    {assigneeOptions.length === 0 ? (
                      <p className="px-2.5 py-4 text-center text-[12px] text-ink-soft">
                        No assignees yet.
                      </p>
                    ) : (
                      assigneeOptions.map((m) => {
                        const on = assignee === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setAssignee(m.id);
                              setAssigneeOpen(false);
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
                          >
                            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                              {m.name}
                            </span>
                            {on && <Check className="size-3.5 shrink-0 text-signal" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Today button */}
              <button
                type="button"
                onClick={scrollToToday}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                <Calendar className="size-3.5" />
                Today
              </button>
            </div>
          </div>

          {/* ── Gantt ─────────────────────────────────────────────────── */}
          <div
            ref={canvasRef}
            className="min-h-0 flex-1 overflow-auto rounded-2xl border border-line bg-card shadow-card"
          >
            <div className="relative min-w-max">
              {/* Header row: sticky "Tasks" cell + month cells */}
              <div className="sticky top-0 z-20 flex h-11">
                <div className="sticky left-0 z-30 flex w-44 shrink-0 items-center border-b border-r border-line bg-paper-raised px-4 text-[12px] font-bold tracking-tight text-ink sm:w-72">
                  Tasks
                </div>
                <div className="flex border-b border-line bg-paper-raised">
                  {months.map((m) => {
                    const current = isSameMonth(m, today);
                    return (
                      <div
                        key={m.toISOString()}
                        style={{ width: colW }}
                        className={cn(
                          "flex shrink-0 items-center justify-center border-r border-line/50 text-[11px] font-semibold",
                          current ? "text-signal" : "text-ink-muted",
                        )}
                      >
                        {format(m, "MMM yyyy")}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Body: frozen task list + scrollable canvas */}
              <div className="flex">
                {/* Left column (frozen) */}
                <div className="sticky left-0 z-10 w-44 shrink-0 bg-card sm:w-72">
                  {spans.map(({ task }) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => ws.openTask(task.id)}
                      style={{ height: ROW_H }}
                      className="flex w-full items-center gap-2 border-b border-r border-line/60 px-4 text-left transition-colors hover:bg-secondary"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: statusColor(task.column) }}
                        title={COLUMN_LABEL[task.column] ?? task.column}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                        {task.title}
                      </span>
                      <AvatarStack ids={task.assigneeIds} size={20} max={2} />
                    </button>
                  ))}
                </div>

                {/* Canvas */}
                <div
                  className="relative"
                  style={{
                    width: canvasWidth,
                    backgroundImage:
                      "linear-gradient(to right, var(--line) 1px, transparent 1px)",
                    backgroundSize: `${colW}px 100%`,
                  }}
                >
                  {spans.map(({ task, start, end }) => {
                    const color = statusColor(task.column);
                    const left = dateX(start);
                    const width = Math.max(dateX(end) - left, 10);
                    const pct = progressPct(task);
                    return (
                      <div
                        key={task.id}
                        style={{ height: ROW_H }}
                        className="relative border-b border-line/60"
                      >
                        <button
                          type="button"
                          onClick={() => ws.openTask(task.id)}
                          title={`${task.title} · ${pct}%`}
                          style={{
                            left,
                            width,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: `${color}26`,
                            borderLeft: `4px solid ${color}`,
                          }}
                          className="absolute flex h-7 items-center overflow-hidden rounded-lg px-2 transition-shadow hover:shadow-raised"
                        >
                          <span
                            aria-hidden
                            style={{ width: `${pct}%`, background: `${color}4d` }}
                            className="absolute inset-y-0 left-0 rounded-l"
                          />
                          <span className="relative truncate text-[11px] font-medium text-ink">
                            {task.title}
                          </span>
                        </button>
                      </div>
                    );
                  })}

                  {/* Today marker */}
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-signal"
                    style={{ left: dateX(today) }}
                  >
                    <span className="absolute -left-px top-0 rounded-b-md bg-signal px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Today
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
