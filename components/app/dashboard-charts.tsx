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
  projectById,
  projectMemberIds,
  taskKey,
} from "@/lib/app-data";
import type { Project, Task } from "@/lib/app-data";
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
const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
/* App reference "today" is 2026-05-27. Ordinal uses a 31-day/372-year scheme
   so comparisons stay monotonic without a real Date parse. */
const TODAY_ORD = 2026 * 372 + 4 * 31 + 27;
function dueOrdinal(due: string): number | null {
  const m = due.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const mo = MONTH_INDEX[m[1].toLowerCase()];
  if (mo === undefined) return null;
  return Number(m[3]) * 372 + mo * 31 + Number(m[2]);
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
const PROGRESS_BY_COLUMN: Record<string, number> = {
  backlog: 12, todo: 28, in_progress: 56, review: 84, done: 100,
};

/* --------------------------------- view ---------------------------------- */
export function DashboardCharts() {
  const { tasks, projects } = useWorkspace();

  const kpis = useMemo<Kpi[]>(() => {
    const done = tasks.filter((t) => t.column === "done").length;
    const notDone = tasks.filter((t) => t.column !== "done");
    const overdue = notDone.filter((t) => {
      const o = dueOrdinal(t.due);
      return o !== null && o < TODAY_ORD;
    }).length;
    const upcoming = notDone.filter((t) => {
      const o = dueOrdinal(t.due);
      return o !== null && o >= TODAY_ORD && o <= TODAY_ORD + 60;
    }).length;
    return [
      { label: "Active Projects", value: projects.length, icon: Layers, accent: "#2563eb" },
      { label: "Tasks Completed", value: done, icon: CheckCircle2, accent: "#22a06b" },
      { label: "Pending Tasks", value: notDone.length, icon: Clock, accent: "#e2a200" },
      { label: "Upcoming Deadlines", value: upcoming, icon: CalendarClock, accent: "#6e5dc6" },
      { label: "Overdue Tasks", value: overdue, icon: TriangleAlert, accent: "#e34935" },
    ];
  }, [tasks, projects]);

  const recent = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => (dueOrdinal(a.due) ?? 0) - (dueOrdinal(b.due) ?? 0))
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
        <ProductivityOverview hasData={tasks.length > 0} />
        <ProjectsPanel projects={projects} />
      </div>

      {/* recent tasks */}
      <RecentTasks tasks={recent} />
    </div>
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
const RANGE_DATA: Record<Range, { labels: string[]; seed: number }> = {
  Daily: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], seed: 7 },
  Weekly: { labels: ["W1", "W2", "W3", "W4", "W5", "W6"], seed: 13 },
  Monthly: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], seed: 23 },
  Yearly: { labels: ["Q1", "Q2", "Q3", "Q4"], seed: 41 },
};

/* deterministic productivity %s in the 60–94 band */
function seededPct(seed: number, n: number) {
  const out: number[] = [];
  let s = seed * 9301 + 49297;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(Math.round(60 + (s / 233280) * 34));
  }
  return out;
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

function ProductivityOverview({ hasData }: { hasData: boolean }) {
  const [range, setRange] = useState<Range>("Weekly");
  const { labels, seed } = RANGE_DATA[range];
  const values = useMemo(() => seededPct(seed, labels.length), [seed, labels.length]);

  /* default the highlight to the peak day */
  const peak = values.indexOf(Math.max(...values));
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? peak;

  if (!hasData) {
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

  const avg = Math.round(values.reduce((s, v) => s + v, 0) / n);
  const ax = pts[active][0];
  const ay = pts[active][1];
  const completed = Math.round((values[active] / 100) * 22);
  const overdue = Math.max(0, Math.round(((100 - values[active]) / 100) * 9));
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
              {avg}%
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <ArrowUpRight className="size-3" strokeWidth={2.4} />
              +7%
            </span>
            <span className="text-[12px] text-ink-soft">avg / period</span>
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
function ProjectsPanel({ projects }: { projects: Project[] }) {
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
          {projects.map((p) => (
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
                    {p.description?.trim() || `${p.key} · ${p.open} open`}
                  </p>
                </div>
                <AvatarStack ids={projectMemberIds(p.id)} size={22} max={3} />
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                <ProgressBar value={p.progress} color={p.color} />
                <span className="tnum w-9 shrink-0 text-right font-mono text-[11px] text-ink-soft">
                  {p.progress}%
                </span>
              </div>
            </Link>
          ))}
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
          const pct = PROGRESS_BY_COLUMN[t.column] ?? 30;
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
