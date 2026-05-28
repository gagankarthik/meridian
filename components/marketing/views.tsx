"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/app/widgets";
import { Reveal, Section } from "./primitives";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: CheckSquare, label: "My tasks" },
  { icon: Users, label: "Team" },
  { icon: CalendarDays, label: "Calendar" },
  { icon: Settings, label: "Settings" },
];

type Card = {
  title: string;
  meta: string;
  bar: string;
  team: { initials: string; hue: string }[];
  tag?: { label: string; tint: string };
};

const TODO: Card[] = [
  {
    title: "Presentation for Dribbble",
    meta: "Due in 3 days",
    bar: "#2563eb",
    team: [
      { initials: "WC", hue: "#2563eb" },
      { initials: "MJ", hue: "#22a06b" },
    ],
    tag: { label: "Design", tint: "#7a3ff0" },
  },
  {
    title: "Mobile app — onboarding flow",
    meta: "5 subtasks",
    bar: "#e2a200",
    team: [{ initials: "TL", hue: "#e2a200" }],
  },
];

const PROGRESS: Card[] = [
  {
    title: "Marketing — landing page",
    meta: "62% complete",
    bar: "#22a06b",
    team: [
      { initials: "SW", hue: "#e2a200" },
      { initials: "AK", hue: "#2563eb" },
      { initials: "RB", hue: "#06b6d4" },
    ],
    tag: { label: "In review", tint: "#22a06b" },
  },
  {
    title: "Design system & components",
    meta: "Updated 2h ago",
    bar: "#7a3ff0",
    team: [{ initials: "MJ", hue: "#22a06b" }],
  },
];

function TaskCard({ card }: { card: Card }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-raised">
      <span
        className="block h-1.5 w-10 rounded-full"
        style={{ background: card.bar }}
      />
      <p className="mt-2.5 text-[13px] font-semibold leading-snug text-ink">
        {card.title}
      </p>
      <p className="mt-1 text-[11px] text-ink-soft">{card.meta}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex -space-x-1.5">
          {card.team.map((t) => (
            <span key={t.initials} className="rounded-full ring-2 ring-card">
              <Avatar initials={t.initials} hue={t.hue} size={20} />
            </span>
          ))}
        </span>
        {card.tag && (
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `color-mix(in srgb, ${card.tag.tint} 14%, transparent)`,
              color: card.tag.tint,
            }}
          >
            {card.tag.label}
          </span>
        )}
      </div>
    </div>
  );
}

function Column({ title, count, cards }: { title: string; count: number; cards: Card[] }) {
  return (
    <div className="rounded-xl bg-paper-raised p-2.5">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="text-[12px] font-bold text-ink">{title}</span>
        <span className="rounded-full bg-secondary px-1.5 text-[10.5px] font-bold text-ink-soft">
          {count}
        </span>
      </div>
      <div className="space-y-2.5">
        {cards.map((c) => (
          <TaskCard key={c.title} card={c} />
        ))}
      </div>
    </div>
  );
}

export function Views() {
  return (
    <Section id="views" className="overflow-hidden py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[clamp(2rem,4.2vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
          Smart task management
          <br className="hidden sm:block" /> for growing teams
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
          Organize projects, assign work, and monitor progress on one platform
          built to improve productivity and teamwork.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14.5px] font-bold text-paper shadow-raised transition-transform hover:scale-[1.02] active:scale-100"
          >
            Start free trial
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

      {/* realistic dashboard mockup */}
      <Reveal delay={0.1} className="mt-14">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-signal/10 via-transparent to-[#7a3ff0]/10 blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-float ring-1 ring-black/[0.03]">
            {/* window chrome */}
            <div className="flex items-center gap-2 border-b border-line bg-paper-raised px-4 py-3">
              <span className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ef4444]/60" />
                <span className="size-2.5 rounded-full bg-[#f59e0b]/60" />
                <span className="size-2.5 rounded-full bg-[#22c55e]/60" />
              </span>
              <span className="ml-3 hidden rounded-md border border-line bg-card px-3 py-1 text-[11px] text-ink-soft sm:block">
                app.meridian.work/dashboard
              </span>
            </div>

            <div className="flex">
              {/* sidebar */}
              <aside className="hidden w-44 shrink-0 border-r border-line p-3 md:block">
                <div className="flex items-center gap-2 px-1.5 py-1">
                  <span className="grid size-6 place-items-center rounded-md bg-signal text-[11px] font-black text-white">
                    M
                  </span>
                  <span className="text-[13px] font-bold text-ink">Meridian</span>
                </div>
                <nav className="mt-4 space-y-0.5">
                  {NAV.map((n) => (
                    <span
                      key={n.label}
                      className={
                        n.active
                          ? "flex items-center gap-2.5 rounded-lg bg-signal-soft px-2.5 py-2 text-[12.5px] font-semibold text-signal"
                          : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-ink-soft"
                      }
                    >
                      <n.icon className="size-4" strokeWidth={2} />
                      {n.label}
                    </span>
                  ))}
                </nav>
              </aside>

              {/* main */}
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                {/* topbar */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                      Project board
                    </p>
                    <h3 className="text-[17px] font-bold tracking-tight text-ink">
                      Checklist — To-Dos
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-[12px] text-ink-soft sm:flex">
                      <Search className="size-3.5" /> Search
                    </span>
                    <span className="grid size-8 place-items-center rounded-lg border border-line bg-card text-ink-soft">
                      <Bell className="size-4" />
                    </span>
                    <Avatar initials="GK" hue="#2563eb" size={32} />
                  </div>
                </div>

                {/* board */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Column title="To Do" count={TODO.length} cards={TODO} />
                  <Column title="In Progress" count={PROGRESS.length} cards={PROGRESS} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
