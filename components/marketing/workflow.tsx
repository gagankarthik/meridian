"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquareText,
  Rocket,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/app/widgets";
import { Reveal, Section } from "./primitives";

type Row = {
  initials?: string;
  hue?: string;
  icon?: LucideIcon;
  from?: string;
  to?: string;
  title: string;
  action: string;
  time: string;
  bubble?: string;
  chip?: { label: string; tint: string };
};

const TABS: { label: string; rows: Row[] }[] = [
  {
    label: "Tracking",
    rows: [
      {
        initials: "LP",
        hue: "#7a3ff0",
        icon: MessageSquareText,
        from: "#60a5fa",
        to: "#1d4ed8",
        title: "Laura Perez",
        action: "commented on your post",
        time: "2 days ago",
        bubble: "Awesome! Let’s jump in 👋",
      },
      {
        initials: "AK",
        hue: "#2563eb",
        icon: UserPlus,
        from: "#4ade80",
        to: "#15803d",
        title: "Albert K.",
        action: "joined Final Presentation",
        time: "6 min ago · Dribbble",
      },
      {
        initials: "SW",
        hue: "#e2a200",
        icon: Heart,
        from: "#fb923c",
        to: "#ea580c",
        title: "Sophia Williams",
        action: "invited you to respa.fig",
        time: "1 hr ago · Figma",
      },
    ],
  },
  {
    label: "Scheduling",
    rows: [
      {
        icon: CalendarDays,
        from: "#60a5fa",
        to: "#1d4ed8",
        title: "Design review",
        action: "with the product team",
        time: "Tomorrow · 10:00 AM",
        chip: { label: "Meeting", tint: "#2563eb" },
      },
      {
        icon: Clock,
        from: "#a78bfa",
        to: "#6d28d9",
        title: "Sprint planning",
        action: "Q3 cycle kickoff",
        time: "Mon · 2:00 PM",
      },
      {
        icon: Rocket,
        from: "#fb7185",
        to: "#be123c",
        title: "Launch day",
        action: "ship v2.0 to production",
        time: "Fri · all day",
        chip: { label: "Milestone", tint: "#e2a200" },
      },
    ],
  },
  {
    label: "Visibility",
    rows: [
      {
        icon: TrendingUp,
        from: "#4ade80",
        to: "#15803d",
        title: "Q3 Launch",
        action: "8 of 12 tasks complete",
        time: "Updated 5 min ago",
        chip: { label: "On track · 82%", tint: "#22a06b" },
      },
      {
        icon: CheckCircle2,
        from: "#22d3ee",
        to: "#0e7490",
        title: "Design system",
        action: "all components shipped",
        time: "Updated 2 hr ago",
        chip: { label: "Completed", tint: "#2563eb" },
      },
      {
        icon: AlertTriangle,
        from: "#fbbf24",
        to: "#d97706",
        title: "API migration",
        action: "blocked on review",
        time: "Updated yesterday",
        chip: { label: "At risk", tint: "#e2a200" },
      },
    ],
  },
];

function FeedRow({ row }: { row: Row }) {
  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-3 shadow-card transition-colors hover:border-ink/15">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {row.initials ? (
            <>
              <Avatar initials={row.initials} hue={row.hue ?? "#2563eb"} size={36} />
              {row.icon && (
                <span
                  className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-card"
                  style={{
                    background: `color-mix(in srgb, ${row.to} 16%, white)`,
                    color: row.to,
                  }}
                >
                  <row.icon className="size-3" strokeWidth={2.4} />
                </span>
              )}
            </>
          ) : (
            row.icon && (
              <span
                className="grid size-9 place-items-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${row.to} 13%, transparent)`,
                  color: row.to,
                }}
              >
                <row.icon className="size-[18px]" strokeWidth={2.1} />
              </span>
            )
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] leading-snug text-ink">
            <span className="font-bold">{row.title}</span> {row.action}
          </p>
          <p className="mt-0.5 text-[11.5px] text-ink-soft">{row.time}</p>
          {row.bubble && (
            <p className="mt-2 inline-block rounded-2xl rounded-tl-sm bg-paper-raised px-3 py-1.5 text-[12.5px] text-ink">
              {row.bubble}
            </p>
          )}
        </div>
        {row.chip && (
          <span
            className="shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-bold"
            style={{
              background: `color-mix(in srgb, ${row.chip.tint} 14%, transparent)`,
              color: row.chip.tint,
            }}
          >
            {row.chip.label}
          </span>
        )}
      </div>
    </div>
  );
}

export function WorkflowSection() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  return (
    <Section id="workflow" className="overflow-hidden py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[clamp(2rem,4.2vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
          Manage tasks faster
          <br className="hidden sm:block" /> with your team
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
          Track, collaborate, and stay on top of deadlines with a powerful yet
          easy-to-use workspace built for momentum.
        </p>
      </Reveal>

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* left — copy + interactive tabs + CTAs */}
        <Reveal>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Workspace views">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                id={`wf-tab-${i}`}
                aria-selected={active === i}
                aria-controls="workflow-panel"
                onClick={() => setActive(i)}
                className={
                  active === i
                    ? "rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-paper transition-colors"
                    : "rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <h3 className="mt-6 font-display text-[26px] font-bold tracking-tight text-ink">
            Simplify task management for modern teams
          </h3>
          <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-muted text-pretty">
            Break down projects into manageable tasks, track progress in real
            time, and keep your whole team focused on what moves the needle.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14.5px] font-bold text-paper shadow-raised transition-transform hover:scale-[1.02] active:scale-100"
            >
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-xl border border-line bg-card px-5 py-3 text-[14.5px] font-bold text-ink shadow-card transition-colors hover:border-ink/30"
            >
              Talk to sales team
            </Link>
          </div>
        </Reveal>

        {/* right — feed that swaps with the active tab */}
        <Reveal delay={0.1}>
          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-signal/12 via-[#06b6d4]/8 to-[#7a3ff0]/12 blur-2xl" />
            <div
              role="tabpanel"
              id="workflow-panel"
              aria-labelledby={`wf-tab-${active}`}
              className="rounded-2xl border border-line bg-card p-3 shadow-float ring-1 ring-black/[0.03]"
            >
              {/* initial={false}: the first panel paints visible immediately
                  (no opacity:0 on load); only tab switches animate. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-2"
                >
                  {TABS[active].rows.map((row, i) => (
                    <FeedRow key={`${active}-${i}`} row={row} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
