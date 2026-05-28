"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarRange,
  CircleDot,
  ExternalLink,
  Layers,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  addQuarters,
  differenceInCalendarDays,
  endOfQuarter,
  max as maxDate,
  min as minDate,
  startOfQuarter,
} from "date-fns";
import { memberById, projectMemberIds } from "@/lib/app-data";
import type { Project } from "@/lib/app-data";
import {
  AvatarStack,
  MemberAvatar,
  ProgressBar,
} from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { projectHref, useDefaultProjectView } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/* ---- Helpers ---------------------------------------------------------- */

/** Status pill palette: On track → green, At risk → amber, Off track → red. */
function statusPillClass(status: Project["status"]): string {
  switch (status) {
    case "On track":
      return "border-green-100 bg-green-50 text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300";
    case "At risk":
      return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";
    case "Off track":
      return "border-red-100 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
    default:
      return "border-line bg-secondary text-ink-muted";
  }
}

function StatusPill({ status }: { status: Project["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        statusPillClass(status),
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

function parseISO(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(iso?: string): string | null {
  const d = parseISO(iso);
  if (!d) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Schedule label "start — end", falling back gracefully when partial/absent. */
function scheduleLabel(p: Project): string {
  const s = fmtDate(p.startDate);
  const e = fmtDate(p.endDate);
  if (s && e) return `${s} — ${e}`;
  if (s) return `From ${s}`;
  if (e) return `Until ${e}`;
  return "No schedule";
}

function quarterLabel(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/* ---- Timeline math ---------------------------------------------------- */

type Quarter = { start: Date; end: Date; label: string };

/**
 * Build the quarter columns spanning every project's real schedule, padded to
 * always include the current quarter so unscheduled work has a home column.
 */
function buildQuarters(projects: Project[]): Quarter[] {
  const dates: Date[] = [new Date()];
  for (const p of projects) {
    const s = parseISO(p.startDate);
    const e = parseISO(p.endDate);
    if (s) dates.push(s);
    if (e) dates.push(e);
  }
  const spanStart = startOfQuarter(minDate(dates));
  const spanEnd = endOfQuarter(maxDate(dates));

  const quarters: Quarter[] = [];
  let cursor = spanStart;
  // Guard against runaway loops on bad data.
  while (cursor <= spanEnd && quarters.length < 40) {
    const end = endOfQuarter(cursor);
    quarters.push({ start: cursor, end, label: quarterLabel(cursor) });
    cursor = addQuarters(cursor, 1);
  }
  return quarters;
}

type BarGeometry = { leftPct: number; widthPct: number; scheduled: boolean };

/**
 * Position a project's bar across the quarter axis as left/width percentages.
 * Unscheduled projects fall back to a compact bar in the current quarter.
 */
function barGeometry(p: Project, quarters: Quarter[]): BarGeometry {
  const axisStart = quarters[0].start;
  const axisEnd = quarters[quarters.length - 1].end;
  const totalDays = Math.max(1, differenceInCalendarDays(axisEnd, axisStart));

  const s = parseISO(p.startDate);
  const e = parseISO(p.endDate);

  if (!s && !e) {
    // No schedule → small bar parked at the start of the current quarter.
    const now = startOfQuarter(new Date());
    const offset = differenceInCalendarDays(now, axisStart);
    const leftPct = (offset / totalDays) * 100;
    return { leftPct: Math.max(0, leftPct), widthPct: 6, scheduled: false };
  }

  const barStart = s ?? e!;
  const barEnd = e ?? s!;
  const startOffset = differenceInCalendarDays(barStart, axisStart);
  const span = Math.max(1, differenceInCalendarDays(barEnd, barStart));

  const leftPct = (startOffset / totalDays) * 100;
  const widthPct = (span / totalDays) * 100;
  return {
    leftPct: Math.max(0, Math.min(100, leftPct)),
    widthPct: Math.max(3, Math.min(100 - Math.max(0, leftPct), widthPct)),
    scheduled: true,
  };
}

/* ---- Page ------------------------------------------------------------- */

export function RoadmapClient() {
  const ws = useWorkspace();
  const defaultView = useDefaultProjectView();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Aggregate stats computed from real workspace data.
  const total = ws.projects.length;
  const activeCount = ws.projects.filter((p) => p.status === "On track").length;
  const openTasks = ws.tasks.filter((t) => t.column !== "done").length;
  const avgComplete =
    total === 0
      ? 0
      : Math.round(
          ws.projects.reduce((sum, p) => sum + (p.progress ?? 0), 0) / total,
        );

  // Featured = furthest-along project; lanes follow start date then progress.
  const ordered = useMemo(
    () => [...ws.projects].sort((a, b) => b.progress - a.progress),
    [ws.projects],
  );
  const featured = ordered[0];

  const lanes = useMemo(
    () =>
      [...ws.projects].sort((a, b) => {
        const sa = parseISO(a.startDate)?.getTime() ?? Infinity;
        const sb = parseISO(b.startDate)?.getTime() ?? Infinity;
        if (sa !== sb) return sa - sb;
        return b.progress - a.progress;
      }),
    [ws.projects],
  );

  const quarters = useMemo(() => buildQuarters(ws.projects), [ws.projects]);

  const active = activeId
    ? (ws.projects.find((p) => p.id === activeId) ?? null)
    : null;

  if (total === 0) {
    return (
      <div className="p-5 sm:p-6 lg:p-8">
        <PortfolioHeader />
        <div className="mt-16 grid place-items-center rounded-2xl border border-line bg-card p-12 text-center shadow-card">
          <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-ink-soft">
            <Layers className="size-6" strokeWidth={1.6} />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            No initiatives yet
          </h3>
          <p className="mt-1.5 max-w-sm text-[13.5px] text-ink-soft">
            Create a project to see it take shape on the portfolio roadmap.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PortfolioHeader />

      {/* Compact stats strip — kept to a single row so the timeline leads. */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Dark stats card */}
        <div className="relative col-span-1 flex items-center justify-between gap-6 overflow-hidden rounded-2xl bg-ink p-5 text-paper shadow-float lg:col-span-7">
          <div className="pointer-events-none absolute -top-12 -right-10 size-44 rounded-full bg-signal/40 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold tracking-wide text-paper/60 uppercase">
              Portfolio health
            </p>
            <p className="tnum mt-2 font-display text-4xl font-extrabold tracking-tight lg:text-5xl">
              {avgComplete}%
            </p>
            <p className="mt-1 text-[12.5px] text-paper/70">
              Avg. completion across {total} initiative
              {total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="relative grid shrink-0 grid-cols-2 gap-3">
            <SideStat label="Active" value={activeCount} />
            <SideStat label="Open tasks" value={openTasks} />
          </div>
        </div>

        {/* Featured initiative mini-card */}
        <button
          type="button"
          onClick={() => setActiveId(featured.id)}
          className="group col-span-1 flex flex-col rounded-2xl border border-line bg-card p-5 text-left shadow-card transition-all hover:shadow-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 lg:col-span-5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-raised px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-ink-soft">
              <CircleDot className="size-3" />
              {featured.key} · Featured
            </span>
            <StatusPill status={featured.status} />
          </div>
          <h3 className="mt-3 truncate font-display text-lg font-bold tracking-tight text-ink">
            {featured.name}
          </h3>
          <div className="mt-auto flex items-center gap-3 pt-4">
            <span className="grow">
              <ProgressBar value={featured.progress} color={featured.color} />
            </span>
            <span className="tnum text-[12.5px] font-semibold text-ink">
              {featured.progress}%
            </span>
            <ArrowUpRight className="size-4 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </button>
      </div>

      {/* Quarter timeline / swimlane — the centerpiece. */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h3 className="inline-flex items-center gap-2 font-display text-[15px] font-bold tracking-tight text-ink">
            <TrendingUp className="size-4 text-ink-soft" />
            Initiative Timeline
          </h3>
          <span className="hidden text-[12px] text-ink-soft sm:inline">
            {quarters[0].label} — {quarters[quarters.length - 1].label}
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Quarter axis header */}
            <div className="flex border-b border-line bg-sunken">
              <div className="w-56 shrink-0 border-r border-line px-5 py-2.5 text-[11px] font-bold tracking-wide text-ink-soft uppercase">
                Initiative
              </div>
              <div className="flex grow">
                {quarters.map((q) => (
                  <div
                    key={q.label}
                    className="grow border-r border-line px-3 py-2.5 text-[11px] font-bold tracking-wide text-ink-soft uppercase last:border-r-0"
                  >
                    {q.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Swimlane rows */}
            {lanes.map((p) => {
              const lead = p.leadIds[0] ? memberById(p.leadIds[0]) : undefined;
              const geo = barGeometry(p, quarters);
              const isActive = p.id === activeId;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "group flex border-b border-line transition-colors last:border-b-0 hover:bg-paper-raised",
                    isActive && "bg-paper-raised",
                  )}
                >
                  {/* Frozen-ish left column: name + lead */}
                  <button
                    type="button"
                    onClick={() => setActiveId(p.id)}
                    className="flex w-56 shrink-0 items-center gap-2.5 border-r border-line px-5 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-inset"
                  >
                    {lead ? (
                      <MemberAvatar member={lead} size={26} />
                    ) : (
                      <span
                        className="grid size-[26px] shrink-0 place-items-center rounded-full bg-secondary text-ink-soft"
                        title="Unassigned"
                      >
                        <Users className="size-3.5" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {p.name}
                      </span>
                      <span className="block truncate font-mono text-[10.5px] text-ink-soft">
                        {p.key}
                      </span>
                    </span>
                  </button>

                  {/* Bar track across the quarter axis */}
                  <div className="relative flex grow items-center px-3 py-3.5">
                    {/* Quarter gridlines */}
                    <div className="pointer-events-none absolute inset-0 flex">
                      {quarters.map((q) => (
                        <div
                          key={q.label}
                          className="grow border-r border-line/60 last:border-r-0"
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveId(p.id)}
                      title={`${p.name} · ${scheduleLabel(p)}`}
                      style={{
                        marginLeft: `${geo.leftPct}%`,
                        width: `${geo.widthPct}%`,
                      }}
                      className={cn(
                        "relative z-10 flex h-9 min-w-9 items-center overflow-hidden rounded-lg border text-left shadow-card transition-all hover:shadow-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/40",
                        geo.scheduled
                          ? "border-line/60"
                          : "border-dashed border-line",
                        isActive && "ring-2 ring-signal/50",
                      )}
                    >
                      {geo.scheduled ? (
                        <>
                          {/* Track tint + progress fill, colored by project */}
                          <span
                            className="absolute inset-0 opacity-25"
                            style={{ background: p.color }}
                          />
                          <span
                            className="absolute inset-y-0 left-0 opacity-90"
                            style={{
                              width: `${p.progress}%`,
                              background: p.color,
                            }}
                          />
                          <span className="relative z-10 flex w-full items-center gap-1.5 px-2.5">
                            <span className="truncate text-[11px] font-bold text-white mix-blend-luminosity drop-shadow">
                              {p.progress}%
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="relative z-10 flex w-full items-center justify-center bg-secondary px-2 text-[10px] font-semibold whitespace-nowrap text-ink-soft">
                          No schedule
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project detail drawer */}
      <ProjectSheet
        project={active}
        open={active !== null}
        onClose={() => setActiveId(null)}
        defaultView={defaultView}
      />
    </div>
  );
}

/* ---- Detail Sheet ----------------------------------------------------- */

function ProjectSheet({
  project,
  open,
  onClose,
  defaultView,
}: {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  defaultView: string;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-line bg-paper sm:max-w-[420px]"
      >
        {project && (
          <>
            <SheetHeader className="border-b border-line p-5">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: project.color }}
                />
                <span className="font-mono text-[11px] font-semibold tracking-wide text-ink-soft">
                  {project.key}
                </span>
              </div>
              <SheetTitle className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
                {project.name}
              </SheetTitle>
              {project.description ? (
                <SheetDescription className="mt-1 text-[13px] text-ink-soft">
                  {project.description}
                </SheetDescription>
              ) : (
                <SheetDescription className="sr-only">
                  Project details
                </SheetDescription>
              )}
              <div className="mt-3">
                <StatusPill status={project.status} />
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 overflow-y-auto p-5">
              <DetailRow label="Lead">
                <LeadCell leadIds={project.leadIds} />
              </DetailRow>

              <DetailRow label="Schedule">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
                  <CalendarRange className="size-3.5 text-ink-soft" />
                  {scheduleLabel(project)}
                </span>
              </DetailRow>

              <DetailRow label="Team">
                <AvatarStack
                  ids={projectMemberIds(project.id)}
                  size={26}
                  max={6}
                />
              </DetailRow>

              <DetailRow label="Progress">
                <div className="flex items-center gap-3">
                  <span className="grow">
                    <ProgressBar
                      value={project.progress}
                      color={project.color}
                    />
                  </span>
                  <span className="tnum text-[12.5px] font-semibold text-ink">
                    {project.progress}%
                  </span>
                </div>
              </DetailRow>
            </div>

            <div className="mt-auto border-t border-line p-5">
              <Link
                href={projectHref(defaultView, project.id)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-semibold text-paper shadow-raised transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
              >
                Open project
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ---- Sub-components --------------------------------------------------- */

function PortfolioHeader() {
  return (
    <div>
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink lg:text-4xl">
        Portfolio Roadmap
      </h2>
      <p className="mt-1.5 max-w-2xl text-[14px] text-ink-soft">
        Strategic alignment and execution across every initiative.
      </p>
    </div>
  );
}

function SideStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-paper/10 bg-paper/5 px-3.5 py-3">
      <p className="tnum font-display text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-paper/60">{label}</p>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3 shadow-card">
      <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function LeadCell({ leadIds }: { leadIds: string[] }) {
  const lead = leadIds[0] ? memberById(leadIds[0]) : undefined;
  if (!lead) {
    return <span className="text-[13px] text-ink-soft">Unassigned</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <MemberAvatar member={lead} size={24} />
      <span className="truncate text-[13px] font-medium text-ink">
        {lead.name}
      </span>
    </span>
  );
}
