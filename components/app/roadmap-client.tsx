"use client";

import { useState } from "react";
import { CalendarRange, Flag, TrendingUp } from "lucide-react";
import { memberById } from "@/lib/app-data";
import type { Goal, Project } from "@/lib/app-data";
import { Avatar, ProgressBar, ProjectAvatar, StatusChip } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";

/* ---- Quarter track ---------------------------------------------------- */

const QUARTERS = ["Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"] as const;
const QUARTER_COUNT = QUARTERS.length;

/** "Now" sits a touch into Q3 2026 (index 1 of 4) on the 0–100 track. */
const NOW_PCT = ((1 + 0.4) / QUARTER_COUNT) * 100;

/** Deterministic per-project span across the quarter track (inclusive quarter indices). */
const SPANS: Record<string, { startQ: number; endQ: number }> = {
  p1: { startQ: 1, endQ: 2 }, // Q3 → Q4 2026
  p2: { startQ: 0, endQ: 1 }, // Q2 → Q3 2026
  p3: { startQ: 0, endQ: 1 }, // Q2 → Q3 2026
  p4: { startQ: 1, endQ: 3 }, // Q3 2026 → Q1 2027
};

/** Fallback span derived deterministically from the project id when not listed above. */
function spanFor(p: Project): { startQ: number; endQ: number } {
  if (SPANS[p.id]) return SPANS[p.id];
  const n = Number(p.id.replace(/\D/g, "")) || 1;
  const startQ = n % QUARTER_COUNT;
  const endQ = Math.min(QUARTER_COUNT - 1, startQ + 1);
  return { startQ, endQ };
}

/** Left offset + width as percentages of the 4-quarter track. */
function geometry(startQ: number, endQ: number) {
  const left = (startQ / QUARTER_COUNT) * 100;
  const width = ((endQ - startQ + 1) / QUARTER_COUNT) * 100;
  return { left, width };
}

function quarterLabel(i: number) {
  return QUARTERS[Math.max(0, Math.min(QUARTER_COUNT - 1, i))];
}

/* ---- Bar -------------------------------------------------------------- */

function RoadmapBar({
  project,
  goals,
}: {
  project: Project;
  goals: Goal[];
}) {
  const [hover, setHover] = useState(false);
  const { startQ, endQ } = spanFor(project);
  const { left, width } = geometry(startQ, endQ);
  const barColor = `color-mix(in srgb, ${project.color} 82%, white)`;
  const lead = project.leadIds[0] ? memberById(project.leadIds[0]) : undefined;

  // Anchor the tooltip on the side that keeps it inside the card/viewport:
  // bars sitting in the right half open their tooltip to the left.
  const tooltipRightAligned = left + width / 2 > 55;

  // Goal milestones linked to this project, placed mid-quarter.
  const milestones = goals
    .filter((g) => g.projectIds.includes(project.id))
    .map((g) => {
      const qi = QUARTERS.indexOf(g.quarter as (typeof QUARTERS)[number]);
      if (qi < 0) return null;
      return { goal: g, leftPct: ((qi + 0.5) / QUARTER_COUNT) * 100 };
    })
    .filter((m): m is { goal: Goal; leftPct: number } => m !== null);

  return (
    <div className="relative flex-1 py-3">
      {/* quarter gridlines — behind everything */}
      <div className="pointer-events-none absolute inset-0 z-0 grid grid-cols-4">
        {QUARTERS.map((q, j) => (
          <div key={q} className={j === 0 ? "" : "border-l border-line/60"} />
        ))}
      </div>

      {/* bar — solid surface + text sits just above the gridlines. When
          hovered it lifts above sibling swimlanes so its tooltip (which
          overflows into the row below) isn't painted over by the next bar. */}
      <div
        className={`relative ${hover ? "z-30" : "z-[1]"}`}
        style={{ marginLeft: `${left}%`, width: `${width}%` }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className="flex h-9 items-center gap-2 overflow-hidden rounded-lg px-2.5 shadow-card transition-transform hover:scale-[1.01]"
          style={{ background: barColor }}
        >
          {lead && (
            <span className="shrink-0 rounded-full ring-2 ring-white/30">
              <Avatar initials={lead.initials} hue={lead.hue} size={20} />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-white">
            {project.name}
          </span>
          <span className="tnum shrink-0 text-[11px] font-bold text-white/90">
            {project.progress}%
          </span>
        </div>

        {/* tooltip — highest within the card; anchored to stay on-screen */}
        {hover && (
          <div
            className={[
              "absolute top-[calc(100%+6px)] z-30 w-60 max-w-[15rem] rounded-xl border border-line bg-card p-3 shadow-raised",
              tooltipRightAligned ? "right-0" : "left-0",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: project.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">
                {project.name}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-ink-soft">
                {project.key}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <StatusChip status={project.status} />
              <span className="tnum text-[11px] font-semibold text-ink-muted">
                {project.progress}%
              </span>
            </div>
            <div className="mt-2.5">
              <ProgressBar value={project.progress} color={project.color} />
            </div>
            <p className="tnum mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
              <CalendarRange className="size-3" />
              {quarterLabel(startQ)} &rarr; {quarterLabel(endQ)}
            </p>
          </div>
        )}
      </div>

      {/* now line — thin marker above the bar */}
      <div
        className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-signal/50"
        style={{ left: `${NOW_PCT}%` }}
      />

      {/* goal milestone diamonds — above the bar, small enough to stay legible */}
      {milestones.map((m) => (
        <span
          key={m.goal.id}
          title={`${m.goal.title} — ${m.goal.quarter}`}
          className="pointer-events-auto absolute top-1/2 z-[3] size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border border-paper bg-signal shadow-card"
          style={{ left: `${m.leftPct}%` }}
        />
      ))}
    </div>
  );
}

/* ---- Page ------------------------------------------------------------- */

export function RoadmapClient() {
  const { projects } = useWorkspace();
  const onTrack = projects.filter((p) => p.status === "On track").length;
  const atRisk = projects.filter(
    (p) => p.status === "At risk" || p.status === "Off track",
  ).length;

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
            How every initiative lines up across the next four quarters &mdash;
            spans, progress, and the goal milestones they&apos;re driving.
          </p>
        </div>

        {/* stat tiles */}
        <div className="flex gap-3">
          <div className="rounded-xl border border-line bg-card px-4 py-2.5 shadow-card">
            <p className="text-[11px] font-semibold text-ink-soft">On track</p>
            <p className="tnum mt-0.5 font-display text-xl font-extrabold text-emerald-700">
              {onTrack}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-card px-4 py-2.5 shadow-card">
            <p className="text-[11px] font-semibold text-ink-soft">At risk</p>
            <p className="tnum mt-0.5 font-display text-xl font-extrabold text-amber-700">
              {atRisk}
            </p>
          </div>
        </div>
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rotate-45 rounded-[2px] bg-signal" />
          Goal milestone
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm bg-signal-soft" />
          Project span
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-signal/60" />
          Now
        </span>
      </div>

      {/* gantt — horizontally scrollable on small screens so nothing squishes */}
      <div className="mt-5 overflow-x-auto">
        {/* No overflow-hidden here: it would clip the hover tooltips. Corners are
            rounded on the header/last row instead. */}
        <div className="min-w-[820px] rounded-2xl border border-line bg-card shadow-card">
          {/* quarter header — divider convention matches the track gridlines exactly */}
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
              {/* lane label — fixed-width cell, never overlapped by bars */}
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

              {/* track — bars are absolutely positioned inside here only */}
              <RoadmapBar project={p} goals={[]} />
            </div>
          ))}
        </div>
      </div>

      {/* goals footnote */}
      <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-ink-soft">
        <Flag className="size-3" />
        Diamonds mark portfolio goals landing in each quarter.
      </p>
    </div>
  );
}
