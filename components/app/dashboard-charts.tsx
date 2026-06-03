"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import {
  COLUMN_LABEL,
  memberById,
  priorityMeta,
  projectById,
  projectMemberIds,
  taskKey,
} from "@/lib/app-data";
import type { Priority, Project, Task } from "@/lib/app-data";
import {
  Avatar,
  AvatarStack,
  ProgressBar,
  ProjectAvatar,
  StatusChip,
} from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { projectHref, useDefaultProjectView } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/* ----------------------------- date helpers ------------------------------ */
/* Real timestamp for a due string like "Jul 14, 2026" (null when it doesn't
   parse / is the "—" placeholder). Used for ordering + overdue/upcoming KPIs. */
function dueTime(due: string): number | null {
  if (!due || due === "—") return null;
  const t = new Date(due).getTime();
  return Number.isNaN(t) ? null : t;
}

type Kpi = {
  label: string;
  value: number;
  icon: typeof Layers;
  accent: string;
};

/* tint helper — works on light or dark surfaces */
const tint = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/* ------------------------------ status meta ------------------------------- */
const STATUS_META: Record<string, { color: string }> = {
  backlog: { color: "#8b909c" },
  todo: { color: "#2563eb" },
  in_progress: { color: "#e2a200" },
  review: { color: "#6e5dc6" },
  done: { color: "#22a06b" },
};
/* Real per-task progress: done → 100%; otherwise the share of its subtasks
   that are complete (0% when there are no subtasks to measure). */
function taskProgress(t: Task): number {
  if (t.column === "done") return 100;
  const subs = t.subtasks ?? [];
  if (subs.length === 0) return 0;
  return Math.round((subs.filter((s) => s.done).length / subs.length) * 100);
}

/* --------------------------------- view ---------------------------------- */
export function DashboardCharts() {
  const { tasks, projects } = useWorkspace();
  /* Capture "now" once at mount (lazy init keeps render pure + stable). */
  const [now] = useState(() => Date.now());

  const kpis = useMemo<Kpi[]>(() => {
    const soon = now + 60 * 86400000; // next 60 days
    const done = tasks.filter((t) => t.column === "done").length;
    const notDone = tasks.filter((t) => t.column !== "done");
    const overdue = notDone.filter((t) => {
      const o = dueTime(t.due);
      return o !== null && o < now;
    }).length;
    const upcoming = notDone.filter((t) => {
      const o = dueTime(t.due);
      return o !== null && o >= now && o <= soon;
    }).length;
    return [
      { label: "Active Projects", value: projects.length, icon: Layers, accent: "#2563eb" },
      { label: "Tasks Completed", value: done, icon: CheckCircle2, accent: "#22a06b" },
      { label: "Pending Tasks", value: notDone.length, icon: Clock, accent: "#e2a200" },
      { label: "Upcoming Deadlines", value: upcoming, icon: CalendarClock, accent: "#6e5dc6" },
      { label: "Overdue Tasks", value: overdue, icon: TriangleAlert, accent: "#e34935" },
    ];
  }, [tasks, projects, now]);

  const recent = useMemo(
    () =>
      [...tasks]
        .sort(
          (a, b) =>
            (dueTime(a.due) ?? Number.POSITIVE_INFINITY) -
            (dueTime(b.due) ?? Number.POSITIVE_INFINITY),
        )
        .slice(0, 6),
    [tasks],
  );

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} />
        ))}
      </div>

      {/* productivity (2/3) + all projects (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProductivityOverview tasks={tasks} now={now} />
        <ProjectsPanel projects={projects} tasks={tasks} />
      </div>

      {/* live distribution: status + priority (both derive from ws.tasks) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusBreakdown tasks={tasks} />
        <PriorityBreakdown tasks={tasks} />
      </div>

      {/* recent tasks */}
      <RecentTasks tasks={recent} />
    </div>
  );
}

/* ----------------------- status / priority breakdown ---------------------- */
const STATUS_ORDER = ["backlog", "todo", "in_progress", "review", "done"];
const PRIORITY_ORDER: Priority[] = ["Urgent", "High", "Medium", "Low"];

function BreakdownRow({
  label,
  count,
  total,
  color,
  delay,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  delay: number;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-24 shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-ink-muted">
        <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate">{label}</span>
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease, delay }}
        />
      </div>
      <span className="tnum w-6 shrink-0 text-right font-mono text-[12px] font-semibold text-ink">
        {count}
      </span>
    </div>
  );
}

function BreakdownCard({
  title,
  total,
  children,
}: {
  title: string;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-line bg-card p-5 shadow-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: 0.4 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
        <span className="tnum font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          {total} total
        </span>
      </div>
      {total === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-soft">No tasks yet.</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </motion.section>
  );
}

function StatusBreakdown({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) counts.set(t.column, (counts.get(t.column) ?? 0) + 1);
    // Known statuses first (in workflow order), then any custom columns.
    const seen = new Set(STATUS_ORDER);
    const extra = [...counts.keys()].filter((c) => !seen.has(c));
    return [...STATUS_ORDER, ...extra].map((col) => ({
      col,
      count: counts.get(col) ?? 0,
    }));
  }, [tasks]);

  return (
    <BreakdownCard title="Tasks by status" total={tasks.length}>
      {data.map((d, i) => (
        <BreakdownRow
          key={d.col}
          label={COLUMN_LABEL[d.col] ?? d.col}
          count={d.count}
          total={tasks.length}
          color={(STATUS_META[d.col] ?? STATUS_META.todo).color}
          delay={0.45 + i * 0.05}
        />
      ))}
    </BreakdownCard>
  );
}

function PriorityBreakdown({ tasks }: { tasks: Task[] }) {
  const data = useMemo(
    () =>
      PRIORITY_ORDER.map((p) => ({
        p,
        count: tasks.filter((t) => t.priority === p).length,
      })),
    [tasks],
  );
  return (
    <BreakdownCard title="Tasks by priority" total={tasks.length}>
      {data.map((d, i) => (
        <BreakdownRow
          key={d.p}
          label={d.p}
          count={d.count}
          total={tasks.length}
          color={priorityMeta[d.p].color}
          delay={0.45 + i * 0.05}
        />
      ))}
    </BreakdownCard>
  );
}

/* ------------------------------- KPI card --------------------------------- */
function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-card transition-shadow hover:shadow-raised"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay: index * 0.06 }}
    >
      {/* tinted corner wash */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-70 blur-2xl"
        style={{ background: tint(kpi.accent, 16) }}
      />
      <div className="relative flex items-start justify-between">
        <span
          className="grid size-10 place-items-center rounded-xl"
          style={{ background: tint(kpi.accent, 14), color: kpi.accent }}
        >
          <kpi.icon className="size-5" strokeWidth={2} />
        </span>
        <ArrowUpRight className="size-4 -translate-y-0.5 translate-x-0.5 text-ink-soft opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
      </div>
      <p className="relative mt-4 text-[12.5px] font-semibold text-ink-soft">
        {kpi.label}
      </p>
      <span className="tnum relative mt-1 block font-display text-[1.9rem] font-extrabold leading-none tracking-tight text-ink">
        {kpi.value}
      </span>
    </motion.div>
  );
}

/* -------------------------- productivity overview ------------------------- */
const RANGES = ["Daily", "Weekly", "Monthly", "Yearly"] as const;
type Range = (typeof RANGES)[number];

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* Parse a due string like "Jul 14, 2026" → Date (or null when it doesn't
   parse / is the "—" placeholder). */
function parseDue(due: string): Date | null {
  if (!due || due === "—") return null;
  const d = new Date(due);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Bucket = {
  label: string;
  /** completion % of tasks due in this window (0 when the window is empty) */
  value: number;
  completed: number;
  overdue: number;
  total: number;
};

/* Bucket real tasks by their due date across the selected range, relative to
   `now`. Each bucket's value is the share of its tasks that are done. */
function buildBuckets(tasks: Task[], range: Range, now: Date): Bucket[] {
  type Acc = { label: string; total: number; done: number; overdue: number };
  const buckets: Acc[] = [];
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  // start-of-day reference for each bucket window
  if (range === "Daily") {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(y, m, d - i);
      buckets.push({ label: WEEKDAY_SHORT[day.getDay()], total: 0, done: 0, overdue: 0 });
    }
  } else if (range === "Weekly") {
    for (let i = 5; i >= 0; i--) {
      buckets.push({ label: `W${6 - i}`, total: 0, done: 0, overdue: 0 });
    }
  } else if (range === "Monthly") {
    for (let i = 5; i >= 0; i--) {
      const mo = new Date(y, m - i, 1);
      buckets.push({ label: MONTH_SHORT[mo.getMonth()], total: 0, done: 0, overdue: 0 });
    }
  } else {
    for (let i = 3; i >= 0; i--) {
      const q = Math.floor(m / 3) - i;
      const qi = ((q % 4) + 4) % 4;
      buckets.push({ label: `Q${qi + 1}`, total: 0, done: 0, overdue: 0 });
    }
  }

  // index of the bucket a given due date falls into, or -1 if outside the window
  function bucketIndex(due: Date): number {
    if (range === "Daily") {
      const diff = Math.floor(
        (new Date(y, m, d).getTime() - new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()) /
          86400000,
      );
      return diff >= 0 && diff <= 6 ? 6 - diff : -1;
    }
    if (range === "Weekly") {
      const startDay = new Date(y, m, d);
      const diffDays = Math.floor(
        (startDay.getTime() - new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()) / 86400000,
      );
      if (diffDays < 0) return -1;
      const wk = Math.floor(diffDays / 7);
      return wk <= 5 ? 5 - wk : -1;
    }
    if (range === "Monthly") {
      const diff = (y - due.getFullYear()) * 12 + (m - due.getMonth());
      return diff >= 0 && diff <= 5 ? 5 - diff : -1;
    }
    // Yearly → trailing 4 quarters
    const nowQ = y * 4 + Math.floor(m / 3);
    const dueQ = due.getFullYear() * 4 + Math.floor(due.getMonth() / 3);
    const diff = nowQ - dueQ;
    return diff >= 0 && diff <= 3 ? 3 - diff : -1;
  }

  for (const t of tasks) {
    const due = parseDue(t.due);
    if (!due) continue;
    const idx = bucketIndex(due);
    if (idx < 0) continue;
    const b = buckets[idx];
    b.total += 1;
    if (t.column === "done") b.done += 1;
    else if (due.getTime() < now.getTime()) b.overdue += 1;
  }

  return buckets.map((b) => ({
    label: b.label,
    value: b.total === 0 ? 0 : Math.round((b.done / b.total) * 100),
    completed: b.done,
    overdue: b.overdue,
    total: b.total,
  }));
}

/* smooth path (Catmull-Rom → cubic bezier) through [x,y] points */
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

function ProductivityOverview({ tasks, now }: { tasks: Task[]; now: number }) {
  const [range, setRange] = useState<Range>("Weekly");
  const buckets = useMemo(
    () => buildBuckets(tasks, range, new Date(now)),
    [tasks, range, now],
  );
  const labels = buckets.map((b) => b.label);
  const values = buckets.map((b) => b.value);

  /* default the highlight to the latest bucket that actually has tasks */
  const lastWithData = (() => {
    for (let i = buckets.length - 1; i >= 0; i--) if (buckets[i].total > 0) return i;
    return buckets.length - 1;
  })();
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? lastWithData;

  if (tasks.length === 0) {
    return (
      <section className="grid min-h-[18rem] place-items-center rounded-2xl border border-line bg-card p-5 text-center shadow-card lg:col-span-2">
        <div>
          <TrendingUp className="mx-auto size-6 text-ink-soft" strokeWidth={1.6} />
          <p className="mt-3 text-[13px] text-ink-soft">
            No productivity data yet. Ship some tasks to see your trend.
          </p>
        </div>
      </section>
    );
  }

  const n = values.length;
  /* band-centered points so hover columns line up with markers */
  const pts = values.map((v, i): [number, number] => {
    const x = ((i + 0.5) / n) * 100;
    const y = 12 + ((100 - v) / 100) * 76; // map 0–100 → 88–12 (top = high)
    return [x, y];
  });
  const linePath = smooth(pts);
  const areaPath = `${linePath} L ${pts[n - 1][0].toFixed(2)} 100 L ${pts[0][0].toFixed(2)} 100 Z`;

  /* headline = overall completion rate across all tasks (real) */
  const totalDone = tasks.filter((t) => t.column === "done").length;
  const overallPct = tasks.length === 0 ? 0 : Math.round((totalDone / tasks.length) * 100);

  /* delta = latest non-empty bucket value minus the previous non-empty one */
  const filled = buckets.filter((b) => b.total > 0);
  const delta =
    filled.length >= 2 ? filled[filled.length - 1].value - filled[filled.length - 2].value : null;

  const ax = pts[active][0];
  const ay = pts[active][1];
  const completed = buckets[active].completed;
  const overdue = buckets[active].overdue;
  const tipRight = ax > 62;

  return (
    <motion.section
      className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-card lg:col-span-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: 0.28 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-ink">
            Productivity Overview
          </h2>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="tnum font-display text-2xl font-extrabold tracking-tight text-ink">
              {overallPct}%
            </span>
            {delta !== null && delta !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  delta > 0
                    ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/12 text-red-700 dark:text-red-300",
                )}
              >
                <ArrowUpRight
                  className={cn("size-3", delta < 0 && "rotate-90")}
                  strokeWidth={2.4}
                />
                {delta > 0 ? "+" : "−"}
                {Math.abs(delta)}%
              </span>
            )}
            <span className="text-[12px] text-ink-soft">completion rate</span>
          </div>
        </div>

        {/* range segmented control */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-paper-raised p-1">
          {RANGES.map((r) => {
            const on = r === range;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRange(r);
                  setHover(null);
                }}
                className="relative rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
              >
                {on && (
                  <motion.span
                    layoutId="prod-range-pill"
                    className="absolute inset-0 rounded-lg bg-signal"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={cn("relative z-10", on ? "text-white" : "text-ink-muted hover:text-ink")}>
                  {r}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* chart */}
      <div className="relative mt-6 h-52 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* horizontal guides */}
          {[28, 52, 76].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="var(--line)"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="2 2"
            />
          ))}
          <motion.path
            d={areaPath}
            fill="url(#prodFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease, delay: 0.35 }}
          />
          {/* active guide line */}
          <line
            x1={ax}
            y1="0"
            x2={ax}
            y2="100"
            stroke="var(--signal)"
            strokeWidth="1"
            strokeOpacity="0.35"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* active marker */}
        <span
          className="pointer-events-none absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-signal shadow-raised"
          style={{ left: `${ax}%`, top: `${ay}%` }}
        />

        {/* tooltip */}
        <motion.div
          key={`${range}-${active}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "pointer-events-none absolute z-20 w-40 rounded-xl border border-line bg-popover p-3 shadow-float",
            tipRight ? "-translate-x-[108%]" : "translate-x-2",
          )}
          style={{ left: `${ax}%`, top: `max(0px, calc(${ay}% - 16px))` }}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="tnum font-display text-lg font-extrabold tracking-tight text-ink">
              {values[active]}%
            </span>
            <span className="text-[10px] font-semibold text-ink-soft">
              Productivity
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Completed
            </span>
            <span className="tnum font-bold text-ink">{completed}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <span className="size-1.5 rounded-full bg-red-500" />
              Overdue
            </span>
            <span className="tnum font-bold text-ink">{overdue}</span>
          </div>
        </motion.div>

        {/* hover bands */}
        <div className="absolute inset-0 flex">
          {values.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={labels[i]}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              className="h-full flex-1 cursor-default"
            />
          ))}
        </div>
      </div>

      {/* x labels */}
      <div className="mt-3 flex">
        {labels.map((l, i) => (
          <span
            key={l}
            className={cn(
              "flex-1 text-center font-mono text-[10px] tracking-wider uppercase transition-colors",
              i === active ? "font-bold text-ink" : "text-ink-soft",
            )}
          >
            {l}
          </span>
        ))}
      </div>
    </motion.section>
  );
}

/* ------------------------------ projects panel ---------------------------- */
function ProjectsPanel({
  projects,
  tasks,
}: {
  projects: Project[];
  tasks: Task[];
}) {
  const defaultView = useDefaultProjectView();
  return (
    <motion.section
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: 0.36 }}
    >
      <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">
          Projects
        </h3>
        <span className="tnum font-mono text-[11px] text-ink-soft">
          {projects.length}
        </span>
      </header>

      {projects.length === 0 ? (
        <p className="px-5 py-12 text-center text-[13px] text-ink-soft">
          No projects yet — they&apos;ll appear here once you&apos;re added to one.
        </p>
      ) : (
        <div className="max-h-[26rem] divide-y divide-line overflow-y-auto">
          {projects.map((p) => {
            // Derive progress + open count from live tasks so the panel reflects
            // task changes immediately (the stored p.progress/p.open are seed
            // values that don't recompute as work moves).
            const ptasks = tasks.filter((t) => t.projectId === p.id);
            const open = ptasks.filter((t) => t.column !== "done").length;
            const progress = ptasks.length
              ? Math.round(((ptasks.length - open) / ptasks.length) * 100)
              : 0;
            return (
            <Link
              key={p.id}
              href={projectHref(defaultView, p.id)}
              className="block px-5 py-4 transition-colors hover:bg-paper-raised"
            >
              <div className="flex items-center gap-3">
                <ProjectAvatar seed={p.name} size={34} rounded="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-ink">
                      {p.name}
                    </span>
                    <StatusChip status={p.status} />
                  </div>
                  <p className="truncate text-[11px] text-ink-soft">
                    {p.description?.trim() || `${p.key} · ${open} open`}
                  </p>
                </div>
                <AvatarStack ids={projectMemberIds(p.id)} size={22} max={3} />
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                <ProgressBar value={progress} color={p.color} />
                <span className="tnum w-9 shrink-0 text-right font-mono text-[11px] text-ink-soft">
                  {progress}%
                </span>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

/* ------------------------------ recent tasks ------------------------------ */
const RT_GRID =
  "grid grid-cols-[minmax(180px,1.6fr)_minmax(120px,1fr)_minmax(110px,1fr)_120px_minmax(120px,1fr)_96px]";

function RecentTasks({ tasks }: { tasks: Task[] }) {
  const ws = useWorkspace();
  return (
    <motion.section
      className="overflow-hidden rounded-2xl border border-line bg-card shadow-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: 0.44 }}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="inline-flex items-center gap-2 text-[15px] font-bold tracking-tight text-ink">
          <TrendingUp className="size-4 text-signal" strokeWidth={2} />
          Recent Tasks
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          {tasks.length} shown
        </span>
      </div>

      {/* header (md+) */}
      <div
        className={cn(
          RT_GRID,
          "hidden border-b border-line bg-paper-raised px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft md:grid",
        )}
      >
        <span>Task</span>
        <span>Assigned to</span>
        <span>Project</span>
        <span>Status</span>
        <span>Progress</span>
        <span className="text-right">Due date</span>
      </div>

      <div className="divide-y divide-line">
        {tasks.length === 0 && (
          <p className="px-5 py-10 text-center text-[13px] text-ink-soft">
            No tasks yet.
          </p>
        )}
        {tasks.map((t) => {
          const assignee = memberById(t.assigneeId);
          const project = projectById(t.projectId);
          const meta = STATUS_META[t.column] ?? STATUS_META.todo;
          const pct = taskProgress(t);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => ws.openTask(t.id)}
              className={cn(
                RT_GRID,
                "w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-paper-raised",
                "max-md:flex max-md:flex-wrap",
              )}
            >
              {/* task */}
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: t.tagColor }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">
                    {t.title}
                  </span>
                  <span className="font-mono text-[10.5px] font-semibold text-ink-soft">
                    {taskKey(t)}
                  </span>
                </span>
              </div>

              {/* assignee */}
              <div className="flex items-center gap-2">
                <Avatar
                  initials={assignee?.initials ?? "?"}
                  hue={assignee?.hue ?? "#8b909c"}
                  seed={assignee?.name ?? t.assigneeId}
                  size={24}
                />
                <span className="truncate text-[12.5px] font-medium text-ink-muted">
                  {assignee?.name.split(" ")[0] ?? "—"}
                </span>
              </div>

              {/* project */}
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: project?.color ?? "var(--signal)" }}
                />
                <span className="truncate text-[12.5px] text-ink-muted">
                  {project?.name ?? "—"}
                </span>
              </div>

              {/* status */}
              <div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: tint(meta.color, 14), color: meta.color }}
                >
                  <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
                  {COLUMN_LABEL[t.column] ?? t.column}
                </span>
              </div>

              {/* progress */}
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: meta.color }}
                  />
                </div>
                <span className="tnum w-8 shrink-0 text-right font-mono text-[11px] font-semibold text-ink-soft">
                  {pct}%
                </span>
              </div>

              {/* due */}
              <span className="tnum text-right text-[12px] font-medium text-ink-soft">
                {t.due}
              </span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
