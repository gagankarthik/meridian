"use client";

import type { LucideIcon } from "lucide-react";
import {
  Check,
  ClipboardList,
  Code2,
  Megaphone,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow, Reveal, RevealItem, Section, Stagger } from "./primitives";

type Solution = {
  color: string;
  icon: LucideIcon;
  category: string;
  title: string;
  desc: string;
  checks: string[];
};

const SOLUTIONS: Solution[] = [
  {
    color: "#2563eb",
    icon: Code2,
    category: "Software development",
    title: "Ship without the status meetings",
    desc: "Track bugs, plan sprints, and cut releases on a board your engineers actually want to open.",
    checks: ["Sprint & backlog planning", "Release tracking", "Automated standups"],
  },
  {
    color: "#e34935",
    icon: Megaphone,
    category: "Marketing",
    title: "Launch every campaign on time",
    desc: "Plan campaigns, manage creative review, and launch on schedule — with every asset in one place.",
    checks: ["Editorial calendar", "Creative approvals", "Launch checklists"],
  },
  {
    color: "#22a06b",
    icon: ClipboardList,
    category: "Operations",
    title: "Keep operations running smoothly",
    desc: "Manage service requests, track incidents, and keep the whole operation humming without the chaos.",
    checks: ["Request intake", "Incident tracking", "SLA visibility"],
  },
  {
    color: "#7a3ff0",
    icon: Server,
    category: "IT & PMO",
    title: "Coordinate across any team",
    desc: "Sequence timelines, track deliverables, and ship cross-functional programs across every team.",
    checks: ["Portfolio timelines", "Dependency mapping", "Executive rollups"],
  },
];

export function Solutions() {
  return (
    <Section id="solutions" className="overflow-hidden py-20 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="mt-4 font-display text-[clamp(2rem,4.2vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
          Built for every team that ships.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
          One platform, infinitely adaptable. However your team works, Meridian
          bends to fit.
        </p>
      </Reveal>

      <Stagger
        className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2"
        stagger={0.1}
      >
        {SOLUTIONS.map((s) => (
          <RevealItem
            key={s.category}
            className="group flex flex-col rounded-2xl border border-line bg-card p-6 shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-float"
          >
            <div
              className="grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `color-mix(in srgb, ${s.color} 14%, transparent)`,
                color: s.color,
              }}
            >
              <s.icon className="size-5" strokeWidth={2.1} />
            </div>

            <p
              className="mt-4 text-[12px] font-bold uppercase tracking-[0.1em]"
              style={{ color: s.color }}
            >
              {s.category}
            </p>
            <h3 className="mt-1.5 font-display text-[19px] font-extrabold tracking-tight text-ink">
              {s.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted text-pretty">
              {s.desc}
            </p>

            <ul className="mt-4 space-y-2">
              {s.checks.map((check) => (
                <li key={check} className="flex items-center gap-2.5">
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-md"
                    style={{
                      background: `color-mix(in srgb, ${s.color} 14%, transparent)`,
                      color: s.color,
                    }}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-[13.5px] text-ink">{check}</span>
                </li>
              ))}
            </ul>

            <a
              href="/#views"
              className={cn(
                "mt-5 inline-flex items-center gap-1 text-[13.5px] font-bold transition-opacity hover:opacity-80",
              )}
              style={{ color: s.color }}
            >
              Explore <span aria-hidden>&rarr;</span>
            </a>
          </RevealItem>
        ))}
      </Stagger>
    </Section>
  );
}
