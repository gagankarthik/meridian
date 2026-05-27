"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Columns3, GanttChartSquare, PieChart } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const TABS = [
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: GanttChartSquare },
  { id: "dashboard", label: "Dashboard", icon: PieChart },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Views() {
  const [tab, setTab] = useState<TabId>("board");

  return (
    <section id="views" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="relative max-w-xl">
            {/* Decorative blue→cyan accent near the heading. */}
            <HeadingAccent />
            <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink text-balance">
              See the work the way you think.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              The same data, rendered for the moment. Plan on a board, sequence
              on a timeline, brief leadership on a dashboard.
            </p>
          </div>

          <div className="inline-flex shrink-0 rounded-xl border border-line bg-card p-1 shadow-card">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                    active ? "text-white" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="view-pill"
                      className="absolute inset-0 rounded-lg bg-signal"
                      transition={{ duration: 0.3, ease }}
                    />
                  )}
                  <t.icon className="relative size-3.5" />
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease }}
          whileHover={{ y: -4 }}
          className="group mt-12 overflow-hidden rounded-2xl border border-line bg-card shadow-float transition-shadow duration-300 hover:shadow-raised"
        >
          <div className="flex items-center justify-between border-b border-line bg-paper-raised px-4 py-2.5">
            <span className="font-mono text-[11px] tracking-wider uppercase text-ink-muted">
              Product · Q3 Launch
            </span>
            <span className="hidden font-mono text-[11px] tracking-wider uppercase text-ink-soft sm:block">
              42 tasks · 6 owners
            </span>
          </div>
          <div className="relative min-h-[420px] bg-sunken/50 p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
              >
                {tab === "board" && <BoardView />}
                {tab === "timeline" && <TimelineView />}
                {tab === "dashboard" && <DashboardView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* Decorative blue→cyan accent that sits behind/above the heading. */
function HeadingAccent() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 24"
      className="mb-4 h-5 w-28"
      fill="none"
    >
      <defs>
        <linearGradient id="views-accent" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <motion.path
        d="M2 18 C 28 18, 28 6, 54 6 S 92 18, 118 6"
        stroke="url(#views-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease }}
      />
      <motion.circle
        cx="2"
        cy="18"
        r="3"
        fill="#2563eb"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2, ease }}
        style={{ transformOrigin: "2px 18px" }}
      />
      <motion.circle
        cx="118"
        cy="6"
        r="3"
        fill="#06b6d4"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.9, ease }}
        style={{ transformOrigin: "118px 6px" }}
      />
    </svg>
  );
}

/* ---------------- Board ---------------- */
const BOARD = [
  {
    name: "Backlog",
    items: [
      ["Audit log retention policy", "Security", "#1d9aaa"],
      ["Mobile offline drafts", "Mobile", "#06b6d4"],
    ],
  },
  {
    name: "In progress",
    items: [
      ["Multi-region read replicas", "Platform", "var(--signal)"],
      ["Onboarding redesign", "Design", "#3b82f6"],
    ],
  },
  {
    name: "Review",
    items: [["SSO / SCIM provisioning", "Security", "#1d9aaa"]],
  },
  {
    name: "Shipped",
    items: [
      ["Portfolio dashboards", "Analytics", "#22a06b"],
      ["Slack notifications v2", "Integrations", "#e2a200"],
    ],
  },
] as const;

function BoardView() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {BOARD.map((col, ci) => (
        <div key={col.name}>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ink">
              {col.name}
            </span>
            <span className="tnum font-mono text-[11px] text-ink-soft">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {col.items.map(([title, tag, color], ii) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.05 * (ci * 2 + ii),
                  ease,
                }}
                className="rounded-sm border border-line bg-paper-raised p-3 transition-colors hover:border-ink/30"
                style={{
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="font-mono text-[10px] tracking-wider uppercase text-ink-soft">
                    {tag}
                  </span>
                </div>
                <p className="text-[12.5px] leading-snug font-medium text-ink">
                  {title}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Timeline ---------------- */
const GANTT = [
  ["Discovery", 0, 22, "#06b6d4"],
  ["Platform foundation", 12, 40, "var(--signal)"],
  ["Design system", 24, 30, "#3b82f6"],
  ["Security & SSO", 40, 34, "#1d9aaa"],
  ["Beta rollout", 58, 28, "#22a06b"],
  ["GA launch", 78, 20, "#e2a200"],
] as const;

function TimelineView() {
  return (
    <div>
      <div className="mb-3 grid grid-cols-4 border-b border-line pb-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft">
        <span>July</span>
        <span>August</span>
        <span>September</span>
        <span className="text-right">October</span>
      </div>
      <div className="relative space-y-3 py-1">
        {/* today marker */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-signal/60"
          style={{ left: "46%" }}
        >
          <span className="absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-signal" />
        </div>
        {GANTT.map(([label, start, width, color], i) => (
          <motion.div
            key={label as string}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease }}
            className="flex items-center gap-3"
          >
            <span className="w-32 shrink-0 truncate text-right text-[12px] text-ink-muted">
              {label}
            </span>
            <div className="relative h-7 flex-1 rounded-sm bg-secondary/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.7, delay: i * 0.06, ease }}
                className="absolute inset-y-0 flex items-center rounded-sm px-2"
                style={{
                  left: `${start}%`,
                  background: color as string,
                }}
              >
                <span className="size-1.5 rounded-full bg-paper/80" />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
const STATS = [
  ["Velocity", "126", "+14%", "#2563eb"],
  ["On-track", "82%", "+5%", "#22a06b"],
  ["At-risk", "7", "-3", "#1d9aaa"],
  ["Cycle time", "2.4d", "-0.6d", "#06b6d4"],
] as const;

const BARS = [40, 62, 48, 78, 70, 92, 84];

function DashboardView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map(([label, value, delta, accent], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease }}
            className="rounded-sm border border-line bg-paper-raised p-4"
          >
            <p className="font-mono text-[10px] tracking-wider uppercase text-ink-soft">
              {label}
            </p>
            <p className="tnum mt-2 font-display text-3xl font-bold tracking-tight text-ink">
              {value}
            </p>
            <p
              className="tnum mt-1 font-mono text-[11px]"
              style={{ color: accent }}
            >
              {delta}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-sm border border-line bg-paper-raised p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ink">
              Weekly throughput
            </span>
            <span className="font-mono text-[10px] tracking-wider uppercase text-ink-soft">
              last 7 weeks
            </span>
          </div>
          <div className="flex h-36 items-end gap-2.5">
            {BARS.map((h, i) => {
              const last = i === BARS.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                  className="flex-1 rounded-t-sm"
                  style={{
                    background: last
                      ? "var(--signal)"
                      : `color-mix(in srgb, #2563eb ${42 + i * 8}%, #06b6d4)`,
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-sm border border-line bg-paper-raised p-5">
          <Donut />
          <p className="mt-3 font-mono text-[10px] tracking-wider uppercase text-ink-soft">
            Status split
          </p>
        </div>
      </div>
    </div>
  );
}

function Donut() {
  const segments = [
    { value: 62, color: "var(--signal)" },
    { value: 24, color: "#06b6d4" },
    { value: 14, color: "#22a06b" },
  ];
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--secondary)" strokeWidth="14" />
      {segments.map((s, i) => {
        const len = (s.value / 100) * c;
        const el = (
          <motion.circle
            key={i}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15 }}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}
