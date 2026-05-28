"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Circle,
  CircleDot,
  Crown,
  Eye,
  ListTodo,
  Loader2,
  Users,
} from "lucide-react";
import {
  COLUMNS,
  memberById,
  priorityMeta,
  projectMemberIds,
} from "@/lib/app-data";
import type { Priority, Project, Task } from "@/lib/app-data";
import {
  Avatar,
  AvatarStack,
  MemberAvatar,
  Panel,
  ProgressBar,
  StatCard,
} from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const STATUS_PALETTE = ["#3b82f6", "#2f6df0", "#e2a200", "#1d9aaa", "#22a06b"];
const PRIORITY_ORDER: Priority[] = ["Urgent", "High", "Medium", "Low"];

/* --------------------------------- view ---------------------------------- */

export function OverviewClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();

  const project =
    ws.projects.find((p) => p.id === projectId) ?? ws.projects[0];

  const tasks = useMemo<Task[]>(
    () => ws.tasks.filter((t) => t.projectId === projectId),
    [ws.tasks, projectId],
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.column === "done").length;
  const inProgress = tasks.filter((t) => t.column === "in_progress").length;
  const open = tasks.filter((t) => t.column !== "done").length;

  const memberIds = useMemo(() => projectMemberIds(projectId), [projectId]);

  if (!project) {
    return (
      <div className="grid h-full place-items-center p-10 text-center text-[13px] text-ink-soft">
        No project yet. Create one to see its overview.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* The project name, status, and description live in the tab header
          above — no duplicate hero here. */}

      {/* KPI tiles */}
      <motion.div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.08 }}
      >
        <StatCard
          label="Total tasks"
          value={String(total)}
          delta="all scopes"
          positive
          icon={ListTodo}
        />
        <StatCard
          label="Completed"
          value={String(done)}
          delta={`${Math.round((done / (total || 1)) * 100)}% done`}
          positive
          icon={CheckCircle2}
        />
        <StatCard
          label="In progress"
          value={String(inProgress)}
          delta="active now"
          positive
          icon={Loader2}
        />
        <StatCard
          label="Open"
          value={String(open)}
          delta="remaining"
          icon={CircleDot}
        />
      </motion.div>

      {/* row: status donut (1/3) + priority + throughput (2/3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatusDonut tasks={tasks} />
        <div className="flex flex-col gap-6 lg:col-span-2">
          <PriorityMix tasks={tasks} />
          <Workload project={project} tasks={tasks} done={done} total={total} />
        </div>
      </div>

      {/* row: people (1/3) + activity (2/3 visually balanced) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PeoplePanel project={project} memberIds={memberIds} />
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- tasks by status ----------------------------- */

function StatusDonut({ tasks }: { tasks: Task[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data = useMemo(
    () =>
      COLUMNS.map((col, i) => ({
        id: col.id,
        name: col.name,
        count: tasks.filter((t) => t.column === col.id).length,
        color: STATUS_PALETTE[i % STATUS_PALETTE.length],
      })),
    [tasks],
  );

  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  const offsets = data.reduce<number[]>((acc, _d, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (data[i - 1].count / total) * c);
    return acc;
  }, []);

  const center =
    hovered === null
      ? { label: "Total tasks", value: total }
      : { label: data[hovered].name, value: data[hovered].count };

  return (
    <Panel title="Tasks by status">
      <div className="flex flex-col items-center gap-5">
        <div className="relative size-44">
          <svg viewBox="0 0 140 140" className="size-44 -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="16"
            />
            {data.map((s, i) => {
              const len = (s.count / total) * c;
              const dim = hovered !== null && hovered !== i;
              return (
                <motion.circle
                  key={s.id}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="16"
                  strokeLinecap="butt"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offsets[i]}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: dim ? 0.35 : 1,
                    strokeWidth: hovered === i ? 20 : 16,
                  }}
                  transition={{
                    opacity: { duration: 0.35, delay: 0.15 + i * 0.08 },
                    strokeWidth: { duration: 0.2 },
                  }}
                />
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tnum font-display text-[2rem] leading-none font-extrabold tracking-tight text-ink">
              {center.value}
            </span>
            <span className="mt-1 text-[11px] font-semibold text-ink-soft">
              {center.label}
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {data.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center gap-2 text-left transition-opacity"
              style={{ opacity: hovered !== null && hovered !== i ? 0.45 : 1 }}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="flex-1 truncate text-[12px] text-ink-muted">
                {s.name}
              </span>
              <span className="tnum font-mono text-[12px] font-semibold text-ink">
                {s.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ priority mix ------------------------------ */

function PriorityMix({ tasks }: { tasks: Task[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const data = useMemo(
    () =>
      PRIORITY_ORDER.map((p) => ({
        priority: p,
        count: tasks.filter((t) => t.priority === p).length,
        color: priorityMeta[p].color,
        label: priorityMeta[p].label,
      })),
    [tasks],
  );
  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <Panel
      title="Tasks by priority"
      action={
        <span className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
          {tasks.length} total
        </span>
      }
    >
      <div className="space-y-5">
        {/* stacked bar */}
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-secondary">
          {data.map((d, i) => {
            const pct = (d.count / total) * 100;
            const active = hovered === i;
            return (
              <motion.div
                key={d.priority}
                className="h-full cursor-pointer first:rounded-l-full last:rounded-r-full"
                style={{ background: d.color }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                initial={{ width: 0 }}
                animate={{
                  width: `${pct}%`,
                  opacity: hovered !== null && !active ? 0.4 : 1,
                }}
                transition={{
                  width: { duration: 0.7, ease, delay: 0.15 + i * 0.08 },
                  opacity: { duration: 0.2 },
                }}
              />
            );
          })}
        </div>

        {/* legend */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {data.map((d, i) => {
            const pct = Math.round((d.count / total) * 100);
            return (
              <button
                key={d.priority}
                type="button"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="flex w-full items-center gap-2.5 text-left transition-opacity"
                style={{
                  opacity: hovered !== null && hovered !== i ? 0.45 : 1,
                }}
              >
                <span
                  className="grid size-5 shrink-0 place-items-center rounded font-mono text-[9px] font-bold text-white"
                  style={{ background: d.color }}
                >
                  {d.label}
                </span>
                <span className="flex-1 text-[13px] font-medium text-ink">
                  {d.priority}
                </span>
                <span className="tnum font-mono text-[12px] text-ink-soft">
                  {pct}%
                </span>
                <span className="tnum w-5 text-right font-mono text-[12px] font-semibold text-ink">
                  {d.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ workload ---------------------------------- */

function Workload({
  project,
  tasks,
  done,
  total,
}: {
  project: Project;
  tasks: Task[];
  done: number;
  total: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Real per-assignee load, derived straight from this project's tasks.
  const data = useMemo(() => {
    const counts = new Map<string, { open: number; done: number }>();
    for (const t of tasks) {
      const ids = t.assigneeIds?.length ? t.assigneeIds : [t.assigneeId];
      for (const id of ids) {
        if (!id) continue;
        const e = counts.get(id) ?? { open: 0, done: 0 };
        if (t.column === "done") e.done += 1;
        else e.open += 1;
        counts.set(id, e);
      }
    }
    return Array.from(counts.entries())
      .map(([id, v]) => ({
        id,
        open: v.open,
        done: v.done,
        total: v.open + v.done,
        member: memberById(id),
      }))
      .filter((d) => d.member)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [tasks]);

  const max = Math.max(1, ...data.map((d) => d.total));
  const completion = Math.round((done / (total || 1)) * 100);

  return (
    <Panel
      title="Workload by assignee"
      action={
        <span className="font-mono text-[11px] tracking-wider uppercase text-ink-soft">
          {data.length} {data.length === 1 ? "person" : "people"}
        </span>
      }
    >
      {data.length === 0 ? (
        <div className="grid place-items-center py-8 text-center text-[13px] text-ink-soft">
          No tasks assigned yet.
        </div>
      ) : (
        <div className="space-y-3.5">
          {data.map((d) => {
            const m = d.member!;
            const active = hovered === d.id;
            const donePct = (d.done / max) * 100;
            const openPct = (d.open / max) * 100;
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 transition-opacity"
                onMouseEnter={() => setHovered(d.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ opacity: hovered && !active ? 0.5 : 1 }}
              >
                <Avatar
                  initials={m.initials}
                  hue={m.hue}
                  seed={m.initials}
                  src={m.avatar}
                  size={26}
                />
                <span className="w-24 shrink-0 truncate text-[12.5px] font-medium text-ink">
                  {m.name.split(" ")[0]}
                </span>
                <div className="flex h-3 flex-1 items-center overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full"
                    style={{ background: project.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${donePct}%` }}
                    transition={{ duration: 0.6, ease }}
                  />
                  <motion.div
                    className="h-full"
                    style={{ background: "var(--secondary)", borderLeft: "1px solid var(--card)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${openPct}%`, background: "color-mix(in srgb, var(--ink) 16%, transparent)" }}
                    transition={{ duration: 0.6, ease, delay: 0.1 }}
                  />
                </div>
                <span className="tnum w-14 shrink-0 text-right font-mono text-[11px] text-ink-soft">
                  {d.done}/{d.total}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* completion meter — real done/total */}
      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold">
          <span className="text-ink-soft">Completion</span>
          <span className="tnum text-ink">
            {done}/{total} · {completion}%
          </span>
        </div>
        <ProgressBar value={completion} color={project.color} />
      </div>
    </Panel>
  );
}

/* ------------------------------ people panel ------------------------------ */

function PeoplePanel({
  project,
  memberIds,
}: {
  project: Project;
  memberIds: string[];
}) {
  const owner = project.ownerId;
  const admins = project.adminIds.filter((id) => id !== owner);

  return (
    <Panel
      title="People"
      action={
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase text-ink-soft">
          <Users className="size-3.5" strokeWidth={1.6} />
          {memberIds.length}
        </span>
      }
    >
      <div className="space-y-5">
        {/* owner & admins */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-soft">
            Owner &amp; admins
          </p>
          {owner && <PersonRow key={owner} id={owner} kind="Owner" />}
          {admins.map((id) => (
            <PersonRow key={id} id={id} kind="Admin" />
          ))}
        </div>

        {/* team */}
        <div className="border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-soft">
              Team
            </p>
            <span className="tnum font-mono text-[12px] font-semibold text-ink">
              {memberIds.length} members
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <AvatarStack ids={memberIds} size={30} max={5} />
            <span className="text-[12px] text-ink-muted">
              on {project.name}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PersonRow({ id, kind }: { id: string; kind: "Owner" | "Admin" }) {
  const m = memberById(id);
  if (!m) return null;
  const isLead = kind === "Owner";
  return (
    <div className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-paper-raised">
      <MemberAvatar member={m} size={30} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{m.name}</p>
        <p className="truncate font-mono text-[11px] text-ink-soft">
          {m.email}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
          isLead
            ? "border-signal/30 bg-signal-soft text-signal"
            : "border-line bg-secondary text-ink-muted",
        )}
      >
        {isLead ? (
          <Crown className="size-3" strokeWidth={2} />
        ) : (
          <Eye className="size-3" strokeWidth={2} />
        )}
        {kind}
      </span>
    </div>
  );
}

/* ----------------------------- recent activity ---------------------------- */

function RecentActivity() {
  const { activity, members } = useWorkspace();
  return (
    <Panel
      title="Recent activity"
      action={
        <ActivityIcon className="size-4 text-ink-soft" strokeWidth={1.6} />
      }
    >
      {activity.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-ink-soft">
          No activity yet.
        </p>
      ) : (
        <ol className="space-y-4">
          {activity.map((a, i) => {
            const m = members.find((mem) => mem.name === a.who);
            return (
            <motion.li
              key={a.id}
              className="flex gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.1 + i * 0.07 }}
            >
              {m ? (
                <MemberAvatar member={m} size={28} />
              ) : (
                <Avatar initials={a.initials} hue="#2563eb" size={28} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-ink">
                  <span className="font-semibold">{a.who}</span>{" "}
                  <span className="text-ink-muted">{a.action}</span>{" "}
                  <span className="text-ink">{a.target}</span>
                </p>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase text-ink-soft">
                  <Circle className="size-2 fill-current" />
                  {a.time} ago
                </span>
              </div>
            </motion.li>
          );
        })}
        </ol>
      )}
    </Panel>
  );
}
