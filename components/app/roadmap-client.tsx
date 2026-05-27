"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, Flag, TrendingUp } from "lucide-react";
import { memberById, projectMemberIds } from "@/lib/app-data";
import type { Project } from "@/lib/app-data";
import {
  Avatar,
  AvatarStack,
  ProgressBar,
  ProjectAvatar,
  StatusChip,
} from "@/components/app/widgets";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWorkspace } from "@/components/app/workspace";
import { projectHref, useDefaultProjectView } from "@/lib/preferences";

/* ---- Quarter track ---------------------------------------------------- */

const QUARTERS = ["Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"] as const;
const QUARTER_COUNT = QUARTERS.length;

/** "Now" sits a touch into Q3 2026 (index 1 of 4) on the 0–100 track. */
const NOW_PCT = ((1 + 0.4) / QUARTER_COUNT) * 100;

/** Fallback span derived deterministically from the project id. */
function fallbackSpan(p: Project): { startQ: number; endQ: number } {
  const n = Number(p.id.replace(/\D/g, "")) || 1;
  const startQ = n % QUARTER_COUNT;
  const endQ = Math.min(QUARTER_COUNT - 1, startQ + 1);
  return { startQ, endQ };
}

/** Quarter index (0–3) for an ISO date on the track that starts 2026-04. */
function quarterIndexForDate(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const months = (d.getFullYear() - 2026) * 12 + (d.getMonth() - 3);
  const qi = Math.floor(months / 3);
  return Math.max(0, Math.min(QUARTER_COUNT - 1, qi));
}

/** Span across the quarter track — from the project's real dates when set. */
function spanFor(p: Project): { startQ: number; endQ: number; real: boolean } {
  const s = p.startDate ? quarterIndexForDate(p.startDate) : null;
  const e = p.endDate ? quarterIndexForDate(p.endDate) : null;
  if (s !== null || e !== null) {
    const startQ = s ?? e ?? 0;
    const endQ = Math.max(startQ, e ?? s ?? startQ);
    return { startQ, endQ, real: true };
  }
  return { ...fallbackSpan(p), real: false };
}

function geometry(startQ: number, endQ: number) {
  const left = (startQ / QUARTER_COUNT) * 100;
  const width = ((endQ - startQ + 1) / QUARTER_COUNT) * 100;
  return { left, width };
}

function quarterLabel(i: number) {
  return QUARTERS[Math.max(0, Math.min(QUARTER_COUNT - 1, i))];
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ---- Bar -------------------------------------------------------------- */

function RoadmapBar({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: (p: Project) => void;
}) {
  const { startQ, endQ } = spanFor(project);
  const { left, width } = geometry(startQ, endQ);
  const barColor = `color-mix(in srgb, ${project.color} 82%, white)`;
  const lead = project.leadIds[0] ? memberById(project.leadIds[0]) : undefined;

  return (
    <div className="relative flex-1 py-3">
      {/* quarter gridlines */}
      <div className="pointer-events-none absolute inset-0 z-0 grid grid-cols-4">
        {QUARTERS.map((q, j) => (
          <div key={q} className={j === 0 ? "" : "border-l border-line/60"} />
        ))}
      </div>

      {/* bar — click opens the detail sheet (no clipped hover tooltip) */}
      <div
        className="relative z-[1]"
        style={{ marginLeft: `${left}%`, width: `${width}%` }}
      >
        <button
          type="button"
          onClick={() => onSelect(project)}
          title={`${project.name} — ${quarterLabel(startQ)} → ${quarterLabel(endQ)}`}
          className="flex h-9 w-full items-center gap-2 overflow-hidden rounded-lg px-2.5 text-left shadow-card transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          style={{ background: barColor }}
        >
          {lead && (
            <span className="shrink-0 rounded-full ring-2 ring-white/30">
              <Avatar
                initials={lead.initials}
                hue={lead.hue}
                seed={lead.initials}
                src={lead.avatar}
                size={20}
              />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-white">
            {project.name}
          </span>
          <span className="tnum shrink-0 text-[11px] font-bold text-white/90">
            {project.progress}%
          </span>
        </button>
      </div>

      {/* now line */}
      <div
        className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-signal/50"
        style={{ left: `${NOW_PCT}%` }}
      />
    </div>
  );
}

/* ---- Page ------------------------------------------------------------- */

export function RoadmapClient() {
  const { projects } = useWorkspace();
  const defaultView = useDefaultProjectView();
  const [selected, setSelected] = useState<Project | null>(null);
  const onTrack = projects.filter((p) => p.status === "On track").length;
  const atRisk = projects.filter(
    (p) => p.status === "At risk" || p.status === "Off track",
  ).length;

  const sel = selected
    ? projects.find((p) => p.id === selected.id) ?? selected
    : null;
  const span = sel ? spanFor(sel) : null;
  const memberIds = sel ? projectMemberIds(sel.id) : [];
  const lead = sel?.leadIds[0] ? memberById(sel.leadIds[0]) : undefined;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            Portfolio
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            Roadmap
          </h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] text-ink-soft">
            How every initiative lines up across the next four quarters. Click a
            bar to see its details.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl border border-line bg-card px-4 py-2.5 shadow-card">
            <p className="text-[11px] font-semibold text-ink-soft">On track</p>
            <p className="tnum mt-0.5 font-display text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {onTrack}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-card px-4 py-2.5 shadow-card">
            <p className="text-[11px] font-semibold text-ink-soft">At risk</p>
            <p className="tnum mt-0.5 font-display text-xl font-extrabold text-amber-700 dark:text-amber-300">
              {atRisk}
            </p>
          </div>
        </div>
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm bg-signal-soft" />
          Project span
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-signal/60" />
          Now
        </span>
      </div>

      {/* gantt */}
      {projects.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-card p-8 text-center text-[13px] text-ink-soft shadow-card">
          No projects yet. Create one to see it on the roadmap.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[820px] rounded-2xl border border-line bg-card shadow-card">
            {/* quarter header */}
            <div className="flex rounded-t-2xl border-b border-line bg-paper-raised">
              <div className="flex w-60 shrink-0 items-center gap-1.5 rounded-tl-2xl border-r border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                <TrendingUp className="size-3.5" />
                Initiative
              </div>
              <div className="grid flex-1 grid-cols-4">
                {QUARTERS.map((q, j) => (
                  <div
                    key={q}
                    className={[
                      "px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft",
                      j === 0 ? "" : "border-l border-line/60",
                    ].join(" ")}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>

            {/* swimlanes */}
            {projects.map((p, i) => (
              <div
                key={p.id}
                className={[
                  "flex items-stretch border-b border-line last:border-b-0",
                  i === projects.length - 1 ? "rounded-b-2xl" : "",
                ].join(" ")}
              >
                <div className="flex w-60 shrink-0 items-center gap-2.5 border-r border-line px-4 py-3">
                  <ProjectAvatar seed={p.name} size={28} rounded="rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">
                      {p.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-ink-soft">
                        {p.key}
                      </span>
                      <StatusChip status={p.status} />
                    </p>
                  </div>
                </div>

                <RoadmapBar project={p} onSelect={setSelected} />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-ink-soft">
        <Flag className="size-3" />
        Set each project&apos;s start &amp; end dates in its Settings tab to
        position it here.
      </p>

      {/* detail side sheet */}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {sel && (
            <>
              <SheetHeader className="border-b border-line">
                <div className="flex items-center gap-3">
                  <ProjectAvatar seed={sel.name} size={40} rounded="rounded-xl" />
                  <div className="min-w-0">
                    <SheetTitle className="truncate font-display text-[18px] font-extrabold tracking-tight text-ink">
                      {sel.name}
                    </SheetTitle>
                    <SheetDescription className="font-mono text-[11px] text-ink-soft">
                      {sel.key}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 overflow-y-auto px-4 pb-4">
                <div className="flex items-center justify-between">
                  <StatusChip status={sel.status} />
                  <span className="tnum text-[13px] font-semibold text-ink">
                    {sel.progress}% complete
                  </span>
                </div>
                <ProgressBar value={sel.progress} color={sel.color} />

                {sel.description && (
                  <p className="text-[13.5px] leading-relaxed text-ink-muted">
                    {sel.description}
                  </p>
                )}

                <div className="rounded-xl border border-line bg-paper-raised p-3.5">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                    <CalendarRange className="size-3.5" />
                    Schedule
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-medium text-ink">
                    {span?.real
                      ? `${fmtDate(sel.startDate) ?? "—"} → ${fmtDate(sel.endDate) ?? "—"}`
                      : `${quarterLabel(span!.startQ)} → ${quarterLabel(span!.endQ)}`}
                  </p>
                  {!span?.real && (
                    <p className="mt-1 text-[11.5px] text-ink-soft">
                      Estimated — set exact dates in the project&apos;s Settings.
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                    Team
                  </p>
                  <div className="flex items-center gap-3">
                    <AvatarStack ids={memberIds} size={28} max={6} />
                    <span className="text-[12.5px] text-ink-muted">
                      {lead ? `Led by ${lead.name}` : `${memberIds.length} members`}
                    </span>
                  </div>
                </div>

                <Link
                  href={projectHref(defaultView, sel.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
                >
                  Open project
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
