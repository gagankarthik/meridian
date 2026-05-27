"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { WORKFLOW } from "@/lib/site";
import { Reveal, Section } from "./primitives";

const ease = [0.16, 1, 0.3, 1] as const;

/* On-palette tints per phase: blue → cyan/teal → green. No purple. */
const STEP_TINTS = ["#2563eb", "#1d9aaa", "#22a06b"] as const;

/* Inline brand-palette illustrations: intake → plan → report. */
const PHASE_ART = [PhaseIntake, PhasePlan, PhaseReport] as const;

export function WorkflowSection() {
  return (
    <section id="workflow" className="border-y border-line bg-paper-raised">
      <Section className="py-24 sm:py-32">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <Reveal delay={0.1}>
              <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink text-balance">
                From intake to outcome, one continuous line.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-sm text-[15px] leading-relaxed text-ink-muted">
              No handoffs lost between tools. Every stage feeds the next, and
              the whole org sees the same state of play.
            </p>
          </Reveal>
        </div>

        <PhaseFlow />
      </Section>
    </section>
  );
}

function PhaseFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });

  return (
    <div ref={ref} className="mt-16">
      {/* Continuous rail with phase nodes — its own band above the cards (desktop). */}
      <div className="relative mb-9 hidden h-3.5 lg:block">
        <div className="absolute left-[16.666%] right-[16.666%] top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-line" />
        <motion.div
          className="absolute left-[16.666%] top-1/2 h-0.5 w-[66.666%] origin-left -translate-y-1/2 rounded-full"
          style={{ background: "linear-gradient(90deg, #2563eb, #1d9aaa, #22a06b)" }}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : undefined}
          transition={{ duration: 1.2, delay: 0.25, ease }}
        />
        <div className="relative grid grid-cols-3">
          {WORKFLOW.map((step, i) => {
            const tint = STEP_TINTS[i % STEP_TINTS.length];
            return (
              <div key={step.index} className="flex justify-center">
                <motion.span
                  aria-hidden
                  initial={{ scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : undefined}
                  transition={{ duration: 0.45, delay: 0.5 + i * 0.16, ease }}
                  className="size-3.5 rounded-full border-2 border-paper-raised"
                  style={{
                    background: tint,
                    boxShadow: `0 0 0 4px color-mix(in srgb, ${tint} 16%, transparent)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {WORKFLOW.map((step, i) => {
          const tint = STEP_TINTS[i % STEP_TINTS.length];
          const Art = PHASE_ART[i % PHASE_ART.length];
          return (
            <motion.div
              key={step.index}
              initial={{ opacity: 0, y: 22 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.14, ease }}
              className="h-full"
            >
              <div className="group relative flex h-full flex-col rounded-2xl border border-line bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-raised">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: tint }}
                  >
                    {step.phase}
                  </span>
                  <span
                    className="inline-flex size-10 items-center justify-center rounded-xl"
                    style={{
                      background: `color-mix(in srgb, ${tint} 12%, white)`,
                      color: tint,
                    }}
                  >
                    <step.icon className="size-5" strokeWidth={1.9} />
                  </span>
                </div>

                {/* Per-phase illustration: intake → plan → report. */}
                <div className="mt-6">
                  <Art tint={tint} inView={inView} delay={0.35 + i * 0.16} />
                </div>

                <h3 className="mt-6 text-[20px] font-bold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Per-phase illustrations ----------------
   Compact 200x64 inline SVGs, animated, in the brand palette. */
type ArtProps = { tint: string; inView: boolean; delay: number };

function softFor(tint: string) {
  return `color-mix(in srgb, ${tint} 14%, white)`;
}

/* Intake: items flowing into a tray (capture). */
function PhaseIntake({ tint, inView, delay }: ArtProps) {
  const soft = softFor(tint);
  return (
    <svg viewBox="0 0 200 64" className="h-16 w-full" fill="none" role="img" aria-label="Intake illustration">
      <rect x="0" y="0" width="200" height="64" rx="10" fill={soft} opacity="0.5" />
      {/* incoming cards */}
      {[0, 1, 2].map((n) => (
        <motion.rect
          key={n}
          x={20 + n * 18}
          y="14"
          width="14"
          height="10"
          rx="2.5"
          fill={tint}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1 - n * 0.22, x: 0 } : undefined}
          transition={{ duration: 0.5, delay: delay + n * 0.12, ease }}
        />
      ))}
      {/* arrow into tray */}
      <motion.path
        d="M76 19 L118 19"
        stroke={tint}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.5, delay: delay + 0.3, ease }}
      />
      <motion.path
        d="M111 13 L119 19 L111 25"
        stroke={tint}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3, delay: delay + 0.55, ease }}
      />
      {/* tray */}
      <rect x="126" y="10" width="54" height="44" rx="7" fill="white" stroke={tint} strokeWidth="2" />
      <line x1="138" y1="30" x2="168" y2="30" stroke={tint} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <line x1="138" y1="40" x2="160" y2="40" stroke={tint} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

/* Plan: connected nodes / dependency graph being built. */
function PhasePlan({ tint, inView, delay }: ArtProps) {
  const soft = softFor(tint);
  const nodes = [
    { x: 30, y: 32 },
    { x: 86, y: 18 },
    { x: 86, y: 46 },
    { x: 150, y: 32 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  return (
    <svg viewBox="0 0 200 64" className="h-16 w-full" fill="none" role="img" aria-label="Plan illustration">
      <rect x="0" y="0" width="200" height="64" rx="10" fill={soft} opacity="0.5" />
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke={tint}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={inView ? { pathLength: 1, opacity: 0.6 } : undefined}
          transition={{ duration: 0.5, delay: delay + i * 0.1, ease }}
        />
      ))}
      {nodes.map((nd, i) => (
        <motion.circle
          key={i}
          cx={nd.x}
          cy={nd.y}
          r="7"
          fill="white"
          stroke={tint}
          strokeWidth="2.5"
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.4, delay: delay + 0.2 + i * 0.1, ease }}
          style={{ transformOrigin: `${nd.x}px ${nd.y}px` }}
        />
      ))}
      <motion.circle
        cx={nodes[3].x}
        cy={nodes[3].y}
        r="3"
        fill={tint}
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : undefined}
        transition={{ duration: 0.4, delay: delay + 0.7, ease }}
        style={{ transformOrigin: `${nodes[3].x}px ${nodes[3].y}px` }}
      />
    </svg>
  );
}

/* Report: rising bars + trend line (results). */
function PhaseReport({ tint, inView, delay }: ArtProps) {
  const soft = softFor(tint);
  const bars = [
    { x: 26, h: 14 },
    { x: 50, h: 22 },
    { x: 74, h: 18 },
    { x: 98, h: 30 },
    { x: 122, h: 26 },
    { x: 146, h: 38 },
  ];
  const base = 50;
  return (
    <svg viewBox="0 0 200 64" className="h-16 w-full" fill="none" role="img" aria-label="Report illustration">
      <rect x="0" y="0" width="200" height="64" rx="10" fill={soft} opacity="0.5" />
      {bars.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          width="12"
          rx="2.5"
          fill={tint}
          opacity={0.45 + i * 0.09}
          initial={{ height: 0, y: base }}
          animate={inView ? { height: b.h, y: base - b.h } : undefined}
          transition={{ duration: 0.5, delay: delay + i * 0.08, ease }}
        />
      ))}
      {/* trend line over the bars */}
      <motion.path
        d="M32 40 L56 30 L80 34 L104 20 L128 24 L152 12"
        stroke={tint}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.8, delay: delay + 0.4, ease }}
      />
      <motion.circle
        cx="152"
        cy="12"
        r="3.5"
        fill="white"
        stroke={tint}
        strokeWidth="2.5"
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : undefined}
        transition={{ duration: 0.4, delay: delay + 1.1, ease }}
        style={{ transformOrigin: "152px 12px" }}
      />
    </svg>
  );
}
