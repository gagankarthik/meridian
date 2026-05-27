"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  COLUMNS,
  priorityMeta,
  projectById,
} from "@/lib/app-data";
import type { Priority, Project, Task } from "@/lib/app-data";
import { Avatar, Panel, StatCard } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const STATUS_PALETTE: Record<string, string> = {
  backlog: "#8b909c",
  todo: "#2563eb",
  in_progress: "#2f6df0",
  review: "#e2a200",
  done: "#22a06b",
};
const PRIORITY_ORDER: Priority[] = ["Urgent", "High", "Medium", "Low"];

type RangeId = "7d" | "30d" | "quarter";
const RANGES: { id: RangeId; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "quarter", label: "Quarter" },
];

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_IDX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/* Parse a due string like "Jul 14, 2026" → Date (or null). */
function parseDueDate(due: string): Date | null {
  const m = due.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const mi = MONTH_IDX[m[1].toLowerCase()];
  if (mi === undefined) return null;
  return new Date(Number(m[3]), mi, Number(m[2]));
}

const DAY_MS = 86400000;
const dayNum = (d: Date) => Math.floor(d.getTime() / DAY_MS);

/* Build a real completed/planned trend by bucketing tasks on their due date
   into the trailing window for the selected range. No fabricated data — empty
   windows simply read zero. */
function buildTrend(tasks: Task[], range: RangeId) {
  const dated = tasks.flatMap((t) => {
    const d = parseDueDate(t.due);
    return d ? [{ done: t.column === "done", date: d }] : [];
  });

  const now = new Date();
  const count = range === "7d" ? 7 : 6;
  const completed = new Array(count).fill(0);
  const planned = new Array(count).fill(0);
  const labels: string[] = [];

  if (range === "quarter") {
    const nowM = now.getFullYear() * 12 + now.getMonth();
    for (let i = 0; i < count; i++) {
      labels.push(MONTH_NAMES_SHORT[((nowM - (count - 1 - i)) % 12 + 12) % 12]);
    }
    for (const { done, date } of dated) {
      const m = date.getFullYear() * 12 + date.getMonth();
      const diff = nowM - m;
      if (diff >= 0 && diff < count) {
        const idx = count - 1 - diff;
        planned[idx] += 1;
        if (done) completed[idx] += 1;
      }
    }
  } else {
    const span = range === "7d" ? 1 : 7; // days per bucket
    const today = dayNum(now);
    for (let i = 0; i < count; i++) {
      const end = today - (count - 1 - i) * span;
      const d = new Date(end * DAY_MS);
      labels.push(range === "7d" ? String(d.getDate()) : `W${i + 1}`);
    }
    for (const { done, date } of dated) {
      const diffDays = today - dayNum(date);
      if (diffDays < 0) continue;
      const bucket = Math.floor(diffDays / span);
      if (bucket >= 0 && bucket < count) {
        const idx = count - 1 - bucket;
        planned[idx] += 1;
        if (done) completed[idx] += 1;
      }
    }
  }

  return { labels, completed, planned };
}

/* --------------------------------- view ---------------------------------- */

export function ReportsClient() {
  const ws = useWorkspace();
  const [projectId, setProjectId] = useState<string>("all");
  const [range, setRange] = useState<RangeId>("30d");

  const tasks = useMemo<Task[]>(
    () =>
      projectId === "all"
        ? ws.tasks
        : ws.tasks.filter((t) => t.projectId === projectId),
    [ws.tasks, projectId],
  );
  const projectsView = useMemo(
    () =>
      projectId === "all"
        ? ws.projects
        : ws.projects.filter((p) => p.id === projectId),
    [ws.projects, projectId],
  );

  const done = tasks.filter((t) => t.column === "done").length;
  const total = tasks.length;
  const completionRate = total ? Math.round((done / total) * 100) : 0;
  const inFlight = tasks.filter(
    (t) => t.column === "in_progress" || t.column === "review",
  ).length;

  /* Real trend bucketed on due dates for the selected range. */
  const trend = useMemo(() => buildTrend(tasks, range), [tasks, range]);
  /* Velocity = tasks completed within the visible window (real throughput). */
  const velocity = trend.completed.reduce((a, b) => a + b, 0);
  const rangeUnit = range === "7d" ? "wk" : range === "30d" ? "6w" : "6mo";

  const empty = total === 0;

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            Analytics
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            Reports
          </h1>
        </div>
        <FilterBar
          projectId={projectId}
          onProject={setProjectId}
          range={range}
          onRange={setRange}
        />
      </div>

      {/* KPI tiles — all derived from real tasks (zeros when empty) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={String(total)}
          delta="all statuses"
          positive
          icon={TrendingUp}
        />
        <StatCard
          label="Completed"
          value={String(done)}
          delta={`${completionRate}% of total`}
          positive
          icon={CheckCircle2}
        />
        <StatCard
          label="In progress"
          value={String(inFlight)}
          delta="active now"
          positive
          icon={Clock}
        />
        <StatCard
          label="Velocity"
          value={`${velocity}/${rangeUnit}`}
          delta="completed in range"
          positive
          icon={Zap}
        />
      </div>

      {/* velocity trend (2/3) + completion gauge (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <VelocityTrend trend={trend} empty={empty} />
        <CompletionGauge done={done} total={total} completion={completionRate} />
      </div>

      {/* throughput by project (2/3) + status distribution (1/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ThroughputByProject projects={projectsView} tasks={tasks} />
        <StatusDistribution tasks={tasks} />
      </div>

      {/* workload leaderboard (full width) */}
      <WorkloadLeaderboard tasks={tasks} />
    </div>
  );
}

/* ------------------------------ filter bar -------------------------------- */

function FilterBar({
  projectId,
  onProject,
  range,
  onRange,
}: {
  projectId: string;
  onProject: (id: string) => void;
  range: RangeId;
  onRange: (r: RangeId) => void;
}) {
  const { projects } = useWorkspace();
  const [open, setOpen] = useState(false);
  const active = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* project dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13px] font-semibold text-ink shadow-card transition-colors hover:border-line-strong"
        >
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: active?.color ?? "var(--signal)" }}
          />
          <span className="max-w-[160px] truncate">
            {active ? active.name : "All projects"}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-ink-soft transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <>
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-line bg-popover py-1.5 shadow-float"
            >
              <DropdownItem
                color="var(--ink-soft)"
                label="All projects"
                selected={projectId === "all"}
                onClick={() => {
                  onProject("all");
                  setOpen(false);
                }}
              />
              <div className="my-1.5 border-t border-line" />
              {projects.map((p) => (
                <DropdownItem
                  key={p.id}
                  color={p.color}
                  label={p.name}
                  selected={projectId === p.id}
                  onClick={() => {
                    onProject(p.id);
                    setOpen(false);
                  }}
                />
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* range segmented control */}
      <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-1 shadow-card">
        {RANGES.map((r) => {
          const on = range === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onRange(r.id)}
              className="relative rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
            >
              {on && (
                <motion.span
                  layoutId="reports-range-pill"
                  className="absolute inset-0 rounded-lg bg-signal"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10",
                  on ? "text-white" : "text-ink-muted hover:text-ink",
                )}
              >
                {r.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropdownItem({
  color,
  label,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-secondary",
        selected ? "text-ink" : "text-ink-muted",
      )}
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <span className="flex-1 truncate">{label}</span>
      {selected && <CheckCircle2 className="size-4 text-signal" />}
    </button>
  );
}

/* ---------------------- 1) velocity / completion trend -------------------- */

function VelocityTrend({
  trend,
  empty,
}: {
  trend: { labels: string[]; completed: number[]; planned: number[] };
  empty: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { labels, completed, planned } = trend;

  if (empty) {
    return (
      <Panel
        title="Velocity trend"
        className="lg:col-span-2"
        action={
          <div className="flex items-center gap-3">
            <Legend color="var(--signal)" label="Completed" />
            <Legend color="var(--ink-soft)" label="Planned" dashed />
          </div>
        }
      >
        <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
          <Zap className="size-6 text-ink-soft" strokeWidth={1.6} />
          <p className="text-[13px] font-semibold text-ink">No velocity yet</p>
          <p className="text-[12px] text-ink-soft">
            Completed tasks will chart here as work ships.
          </p>
        </div>
      </Panel>
    );
  }

  const W = 560;
  const H = 200;
  const PAD = 12;
  const max = Math.max(1, ...planned, ...completed);
  const n = completed.length;
  const xAt = (i: number) =>
    n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2);
  const yAt = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

  const linePath = completed
    .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`)
    .join(" ");
  const plannedPath = planned
    .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(v)}`)
    .join(" ");
  const areaPath = `${linePath} L${xAt(n - 1)},${H - PAD} L${xAt(0)},${H - PAD} Z`;

  return (
    <Panel
      title="Velocity trend"
      className="lg:col-span-2"
      action={
        <div className="flex items-center gap-3">
          <Legend color="var(--signal)" label="Completed" />
          <Legend color="var(--ink-soft)" label="Planned" dashed />
        </div>
      }
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-52 w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="velFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={PAD}
              x2={W - PAD}
              y1={PAD + g * (H - PAD * 2)}
              y2={PAD + g * (H - PAD * 2)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}

          {/* area */}
          <motion.path
            d={areaPath}
            fill="url(#velFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease }}
          />

          {/* planned (dashed) */}
          <motion.path
            d={plannedPath}
            fill="none"
            stroke="var(--ink-soft)"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease }}
          />

          {/* completed line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--signal)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease }}
          />

          {/* points + hover */}
          {completed.map((v, i) => (
            <g
              key={`${labels[i]}-${i}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={xAt(i) - (W / n) / 2}
                y={0}
                width={W / n}
                height={H}
                fill="transparent"
              />
              {hovered === i && (
                <line
                  x1={xAt(i)}
                  x2={xAt(i)}
                  y1={PAD}
                  y2={H - PAD}
                  stroke="var(--line-strong)"
                  strokeWidth="1"
                />
              )}
              <motion.circle
                cx={xAt(i)}
                cy={yAt(v)}
                r={hovered === i ? 5 : 3}
                fill="var(--card)"
                stroke="var(--signal)"
                strokeWidth="2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
              />
            </g>
          ))}
        </svg>

        {/* tooltip */}
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-lg bg-ink px-3 py-1.5 text-center shadow-float"
          >
            <span className="block font-mono text-[10px] uppercase tracking-wider text-paper/70">
              {labels[hovered]}
            </span>
            <span className="tnum block font-mono text-[12px] font-semibold text-paper">
              {completed[hovered]} done · {planned[hovered]} planned
            </span>
          </motion.div>
        )}

        {/* x labels */}
        <div className="mt-2 flex justify-between px-1">
          {labels.map((l, i) => (
            <span
              key={`${l}-${i}`}
              className="font-mono text-[10px] tracking-wider text-ink-soft"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
      <span
        className={cn("h-0.5 w-4", dashed && "opacity-70")}
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}

/* --------------------------- 2) cycle-time gauge -------------------------- */

function CompletionGauge({
  done,
  total,
  completion,
}: {
  done: number;
  total: number;
  completion: number;
}) {
  const ratio = Math.min(1, Math.max(0, completion / 100));
  const r = 60;
  const c = Math.PI * r; // semicircle length
  const filled = c * ratio;
  const open = total - done;
  const label = completion >= 70 ? "On pace" : completion >= 35 ? "In progress" : "Early";
  const labelColor =
    completion >= 70 ? "#22a06b" : completion >= 35 ? "#2563eb" : "#e2a200";

  return (
    <Panel title="Completion">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-28 w-44">
          <svg viewBox="0 0 160 88" className="h-28 w-44">
            <path
              d="M 20 80 A 60 60 0 0 1 140 80"
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <motion.path
              d="M 20 80 A 60 60 0 0 1 140 80"
              fill="none"
              stroke={labelColor}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c - filled }}
              transition={{ duration: 1, ease }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
            <span className="tnum font-display text-[2.1rem] leading-none font-extrabold tracking-tight text-ink">
              {completion}%
            </span>
            <span className="text-[11px] font-semibold text-ink-soft">
              complete
            </span>
          </div>
        </div>

        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: `${labelColor}1a`, color: labelColor }}
        >
          {label}
        </span>

        <div className="grid w-full grid-cols-2 gap-3 border-t border-line pt-4 text-center">
          <div>
            <p className="tnum font-display text-xl font-extrabold text-ink">
              {done}
            </p>
            <p className="text-[11px] font-semibold text-ink-soft">Done</p>
          </div>
          <div>
            <p className="tnum font-display text-xl font-extrabold text-ink">
              {open}
            </p>
            <p className="text-[11px] font-semibold text-ink-soft">Open</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ----------------------- 3) throughput by project ------------------------- */

function ThroughputByProject({
  projects,
  tasks,
}: {
  projects: Project[];
  tasks: Task[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const data = useMemo(
    () =>
      projects.map((p) => {
        const segs = COLUMNS.map((col) => ({
          id: col.id,
          name: col.name,
          count: tasks.filter(
            (t) => t.projectId === p.id && t.column === col.id,
          ).length,
          color: STATUS_PALETTE[col.id] ?? "#2563eb",
        }));
        return { project: p, segs, total: segs.reduce((s, x) => s + x.count, 0) };
      }),
    [projects, tasks],
  );
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <Panel
      title="Throughput by project"
      className="lg:col-span-2"
      action={
        <span className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
          stacked by status
        </span>
      }
    >
      {data.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink-soft">
          No projects yet.
        </p>
      ) : (
      <>
      <div className="space-y-4">
        {data.map(({ project, segs, total }, i) => {
          const active = hovered === null || hovered === project.id;
          return (
            <div
              key={project.id}
              onMouseEnter={() => setHovered(project.id)}
              onMouseLeave={() => setHovered(null)}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 font-semibold text-ink">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: project.color }}
                  />
                  {project.name}
                </span>
                <span className="tnum font-mono text-ink-soft">{total}</span>
              </div>
              <div className="flex h-5 w-full overflow-hidden rounded-md bg-secondary">
                {segs.map((s) => {
                  const pct = (s.count / max) * 100;
                  if (s.count === 0) return null;
                  return (
                    <motion.div
                      key={s.id}
                      className="h-full"
                      style={{ background: s.color }}
                      title={`${s.name}: ${s.count}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%`, opacity: active ? 1 : 0.4 }}
                      transition={{
                        width: { duration: 0.7, ease, delay: 0.1 + i * 0.08 },
                        opacity: { duration: 0.2 },
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* status legend */}
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4">
        {COLUMNS.map((col) => (
          <span
            key={col.id}
            className="flex items-center gap-1.5 text-[11px] font-medium text-ink-soft"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: STATUS_PALETTE[col.id] }}
            />
            {col.name}
          </span>
        ))}
      </div>
      </>
      )}
    </Panel>
  );
}

/* ----------------------- 4) status distribution --------------------------- */

function StatusDistribution({ tasks }: { tasks: Task[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data = useMemo(() => {
    const byPriority = PRIORITY_ORDER.map((p) => ({
      key: p,
      count: tasks.filter((t) => t.priority === p).length,
      color: priorityMeta[p].color,
      label: priorityMeta[p].label,
    }));
    return byPriority;
  }, [tasks]);

  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  const offsets = data.reduce<number[]>((acc, _d, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (data[i - 1].count / total) * c);
    return acc;
  }, []);

  const center =
    hovered === null
      ? { label: "All tasks", value: total }
      : { label: data[hovered].key, value: data[hovered].count };

  return (
    <Panel title="Priority distribution">
      <div className="flex flex-col items-center gap-5">
        <div className="relative size-40">
          <svg viewBox="0 0 140 140" className="size-40 -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="14"
            />
            {data.map((d, i) => {
              const len = (d.count / total) * c;
              const dim = hovered !== null && hovered !== i;
              return (
                <motion.circle
                  key={d.key}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="14"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offsets[i]}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: dim ? 0.35 : 1,
                    strokeWidth: hovered === i ? 18 : 14,
                  }}
                  transition={{
                    opacity: { duration: 0.35, delay: 0.15 + i * 0.1 },
                    strokeWidth: { duration: 0.2 },
                  }}
                />
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tnum font-display text-[1.9rem] leading-none font-extrabold tracking-tight text-ink">
              {center.value}
            </span>
            <span className="mt-1 text-[11px] font-semibold text-ink-soft">
              {center.label}
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
          {data.map((d, i) => {
            const pct = Math.round((d.count / total) * 100);
            return (
              <button
                key={d.key}
                type="button"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="flex items-center gap-2 text-left transition-opacity"
                style={{ opacity: hovered !== null && hovered !== i ? 0.45 : 1 }}
              >
                <span
                  className="grid size-5 shrink-0 place-items-center rounded font-mono text-[9px] font-bold text-white"
                  style={{ background: d.color }}
                >
                  {d.label}
                </span>
                <span className="flex-1 truncate text-[12px] text-ink-muted">
                  {d.key}
                </span>
                <span className="tnum font-mono text-[11px] text-ink-soft">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

/* ----------------------- 5) workload leaderboard -------------------------- */

function WorkloadLeaderboard({ tasks }: { tasks: Task[] }) {
  const { members } = useWorkspace();
  const [hovered, setHovered] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      members.map((m) => {
        const assigned = tasks.filter((t) => t.assigneeId === m.id);
        const done = assigned.filter((t) => t.column === "done").length;
        const active = assigned.filter(
          (t) => t.column === "in_progress" || t.column === "review",
        ).length;
        const counts = assigned.reduce<Record<string, number>>((acc, t) => {
          acc[t.projectId] = (acc[t.projectId] ?? 0) + 1;
          return acc;
        }, {});
        const topProject =
          Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        return { member: m, count: assigned.length, done, active, topProject };
      })
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count),
    [tasks],
  );
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Panel
      title="Workload leaderboard"
      action={
        <span className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
          {rows.length} contributors
        </span>
      }
    >
      {rows.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink-soft">
          No assigned work yet.
        </p>
      ) : (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[24px_1fr_120px_70px_70px] items-center gap-4 border-b border-line px-1 pb-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          <span>#</span>
          <span>Member</span>
          <span>Assigned</span>
          <span className="text-right">Active</span>
          <span className="text-right">Done</span>
        </div>

        <div className="divide-y divide-line">
          {rows.map((row, i) => {
            const active = hovered === null || hovered === row.member.id;
            const w = (row.count / max) * 100;
            const proj = row.topProject ? projectById(row.topProject) : undefined;
            return (
              <motion.div
                key={row.member.id}
                onMouseEnter={() => setHovered(row.member.id)}
                onMouseLeave={() => setHovered(null)}
                className="grid grid-cols-[24px_1fr_120px_70px_70px] items-center gap-4 px-1 py-3 transition-colors hover:bg-paper-raised"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: active ? 1 : 0.5, y: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.05 + i * 0.05 }}
              >
                <span
                  className={cn(
                    "tnum grid size-6 place-items-center rounded-md font-mono text-[11px] font-bold",
                    i === 0
                      ? "bg-signal text-white"
                      : "bg-secondary text-ink-muted",
                  )}
                >
                  {i + 1}
                </span>

                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar
                    initials={row.member.initials}
                    hue={row.member.hue}
                    seed={row.member.initials}
                    src={row.member.avatar}
                    size={30}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-ink">
                      {row.member.name}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-ink-soft">
                      {proj && (
                        <span
                          className="size-2 rounded-full"
                          style={{ background: proj.color }}
                        />
                      )}
                      {proj ? proj.name : "Unassigned focus"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: row.member.hue }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(w, 8)}%` }}
                      transition={{ duration: 0.7, ease, delay: 0.1 + i * 0.06 }}
                    />
                  </div>
                  <span className="tnum w-5 shrink-0 text-right font-mono text-[12px] font-semibold text-ink">
                    {row.count}
                  </span>
                </div>

                <span className="tnum text-right font-mono text-[12px] text-ink-muted">
                  {row.active}
                </span>
                <span className="tnum text-right font-mono text-[12px] font-semibold text-ink">
                  {row.done}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
      )}
    </Panel>
  );
}
