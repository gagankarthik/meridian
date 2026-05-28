"use client";

import { Lightbulb, Repeat, Timer, Users } from "lucide-react";
import { Reveal, RevealItem, Section, Stagger } from "./primitives";

const FEATURES = [
  {
    icon: Users,
    tint: "#2563eb",
    title: "Entire team aligned",
    desc: "Keep everyone on the same page with clear goals, shared context, and real-time updates as work moves.",
  },
  {
    icon: Timer,
    tint: "#22a06b",
    title: "5 hours / week saved",
    desc: "Automate routine handoffs and streamline workflows to win back real focus time every single week.",
  },
  {
    icon: Repeat,
    tint: "#e2a200",
    title: "10% lower churn",
    desc: "Better task visibility and smoother teamwork help you deliver consistent results customers stay for.",
  },
  {
    icon: Lightbulb,
    tint: "#7a3ff0",
    title: "200+ votes on one idea",
    desc: "Let your team and stakeholders share ideas and vote on what matters, so you build the right things.",
  },
];

export function Features() {
  return (
    <Section id="features" className="py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[clamp(2rem,4.2vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
          Simplify task management
          <br className="hidden sm:block" /> for modern teams
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
          Everything your team needs to plan, track, and ship great work —
          without the busywork getting in the way.
        </p>
      </Reveal>

      <Stagger className="relative mx-auto mt-14 grid max-w-4xl grid-cols-1 sm:grid-cols-2">
        {/* crosshair dividers (desktop) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
          <div className="absolute left-1/2 top-[8%] h-[84%] w-px -translate-x-1/2 bg-line" />
          <div className="absolute left-[6%] top-1/2 h-px w-[88%] -translate-y-1/2 bg-line" />
          <div className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-card" />
        </div>

        {FEATURES.map((f) => (
          <RevealItem
            key={f.title}
            className="group px-6 py-10 text-center sm:px-10"
          >
            <div
              className="mx-auto grid size-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
              style={{
                background: `color-mix(in srgb, ${f.tint} 12%, transparent)`,
                color: f.tint,
              }}
            >
              <f.icon className="size-6" strokeWidth={2} />
            </div>
            <h3 className="mt-5 text-[18px] font-bold tracking-tight text-ink">
              {f.title}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-[14.5px] leading-relaxed text-ink-muted text-pretty">
              {f.desc}
            </p>
          </RevealItem>
        ))}
      </Stagger>
    </Section>
  );
}
