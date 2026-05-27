import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/site";
import { Reveal, Section } from "./primitives";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <Section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal delay={0.1}>
          <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink text-balance">
            Priced to scale with the work.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Start free. Upgrade when the org does. No seat games, no surprise
            metering.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 0.07} className="h-full">
            <div
              className={cn(
                "flex h-full flex-col rounded-2xl p-8 transition-all hover:-translate-y-1",
                plan.featured
                  ? "brand-gradient text-white shadow-float lg:-mt-4 lg:pb-12"
                  : "border border-line bg-card text-ink shadow-card hover:shadow-raised",
              )}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    "text-[15px] font-bold",
                    plan.featured ? "text-white/90" : "text-ink",
                  )}
                >
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-signal">
                    Most popular
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-extrabold tracking-tight">
                  {plan.price}
                </span>
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    plan.featured ? "text-white/70" : "text-ink-soft",
                  )}
                >
                  {plan.cadence}
                </span>
              </div>
              <p
                className={cn(
                  "mt-4 text-[14px] leading-relaxed",
                  plan.featured ? "text-white/80" : "text-ink-muted",
                )}
              >
                {plan.blurb}
              </p>

              <Link
                href="/app"
                className={cn(
                  "mt-7 inline-flex items-center justify-center rounded-xl px-4 py-3 text-[14px] font-bold transition-colors",
                  plan.featured
                    ? "bg-white text-signal hover:bg-white/90"
                    : "bg-signal text-white hover:bg-signal-strong",
                )}
              >
                {plan.cta}
              </Link>

              <ul
                className="mt-8 space-y-3 border-t pt-7"
                style={{
                  borderColor: plan.featured
                    ? "rgba(255,255,255,0.22)"
                    : "var(--line)",
                }}
              >
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px]">
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                        plan.featured ? "bg-white/20" : "bg-signal-soft",
                      )}
                    >
                      <Check
                        className={plan.featured ? "size-3 text-white" : "size-3 text-signal"}
                        strokeWidth={3}
                      />
                    </span>
                    <span className={plan.featured ? "text-white/90" : "text-ink"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
