import type { ComponentType } from "react";
import {
  Check,
  Code2,
  Megaphone,
  ClipboardList,
  Server,
  type LucideIcon,
} from "lucide-react";
import { Reveal, Section } from "./primitives";
import {
  BoardIllustration,
  TimelineIllustration,
  AutomationIllustration,
  ReportingIllustration,
} from "./illustrations";
import { cn } from "@/lib/utils";

type UseCase = {
  icon: LucideIcon;
  tint: string;
  team: string;
  title: string;
  body: string;
  points: string[];
  illustration: ComponentType<{ className?: string }>;
};

const USE_CASES: UseCase[] = [
  {
    icon: Code2,
    tint: "#2563eb",
    team: "Software development",
    title: "Ship without the status meetings",
    body: "Track bugs, plan sprints, and cut releases on a board your engineers actually want to open.",
    points: ["Sprint & backlog planning", "Release tracking", "Automated standups"],
    illustration: BoardIllustration,
  },
  {
    icon: Megaphone,
    tint: "#e34935",
    team: "Marketing",
    title: "Launch every campaign on time",
    body: "Plan campaigns, manage creative review, and launch on schedule — with every asset in one place.",
    points: ["Editorial calendar", "Creative approvals", "Launch checklists"],
    illustration: ReportingIllustration,
  },
  {
    icon: ClipboardList,
    tint: "#22a06b",
    team: "Operations",
    title: "Keep operations running smoothly",
    body: "Manage service requests, track incidents, and keep the whole operation humming without the chaos.",
    points: ["Request intake", "Incident tracking", "SLA visibility"],
    illustration: AutomationIllustration,
  },
  {
    icon: Server,
    tint: "#7a3ff0",
    team: "IT & PMO",
    title: "Coordinate across any team",
    body: "Sequence timelines, track deliverables, and ship cross-functional programs across every team.",
    points: ["Portfolio timelines", "Dependency mapping", "Executive rollups"],
    illustration: TimelineIllustration,
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-20 border-y border-line bg-paper-raised">
      <Section className="py-24 sm:py-32">
        <div className="max-w-2xl">
          <Reveal delay={0.1}>
            <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink text-balance">
              Built for every team that ships.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              One platform, infinitely adaptable. However your team works,
              Meridian bends to fit — not the other way around.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-24">
          {USE_CASES.map((uc, i) => {
            const Illustration = uc.illustration;
            const reverse = i % 2 === 1;
            return (
              <Reveal key={uc.team} delay={0.05}>
                <div
                  className={cn(
                    "flex flex-col gap-8 lg:items-center lg:gap-14",
                    reverse ? "lg:flex-row-reverse" : "lg:flex-row",
                  )}
                >
                  {/* illustration panel */}
                  <div className="lg:w-1/2">
                    <div
                      className="relative overflow-hidden rounded-3xl border border-line p-8 shadow-card sm:p-10"
                      style={{
                        background: `linear-gradient(145deg, color-mix(in srgb, ${uc.tint} 16%, white) 0%, color-mix(in srgb, ${uc.tint} 5%, white) 100%)`,
                      }}
                    >
                      <span
                        className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full blur-3xl"
                        style={{
                          background: `radial-gradient(circle, color-mix(in srgb, ${uc.tint} 50%, transparent), transparent 70%)`,
                        }}
                      />
                      <span
                        className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full blur-3xl"
                        style={{
                          background: `radial-gradient(circle, color-mix(in srgb, ${uc.tint} 28%, transparent), transparent 70%)`,
                        }}
                      />
                      <Illustration className="relative mx-auto w-full max-w-[420px] drop-shadow-sm" />
                    </div>
                  </div>

                  {/* content */}
                  <div className="lg:w-1/2">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex size-11 items-center justify-center rounded-xl"
                        style={{
                          background: `color-mix(in srgb, ${uc.tint} 14%, white)`,
                          color: uc.tint,
                        }}
                      >
                        <uc.icon className="size-5" strokeWidth={1.9} />
                      </span>
                      <span
                        className="text-[12px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: uc.tint }}
                      >
                        {uc.team}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-extrabold leading-[1.1] tracking-tight text-ink">
                      {uc.title}
                    </h3>
                    <p className="mt-3.5 max-w-md text-[15.5px] leading-relaxed text-ink-muted">
                      {uc.body}
                    </p>
                    <ul className="mt-6 space-y-2.5">
                      {uc.points.map((p) => (
                        <li key={p} className="flex items-center gap-2.5">
                          <span
                            className="grid size-5 shrink-0 place-items-center rounded-full"
                            style={{
                              background: `color-mix(in srgb, ${uc.tint} 16%, white)`,
                              color: uc.tint,
                            }}
                          >
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                          <span className="text-[14px] font-medium text-ink">
                            {p}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#platform"
                      className="mt-7 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-white shadow-card transition-transform hover:-translate-y-0.5"
                      style={{ background: uc.tint }}
                    >
                      Explore {uc.team.split(" ")[0]} →
                    </a>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </section>
  );
}
