import { COMPLIANCE } from "@/lib/site";
import { Reveal, Section } from "./primitives";

export function Security() {
  return (
    <section className="border-y border-line bg-paper-raised">
      <Section id="security" className="py-24 sm:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink text-balance">
                Enterprise-grade by default, not by upgrade.
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-5 text-lg leading-relaxed text-ink-muted">
                Encryption everywhere, granular roles, full audit trails, and
                the certifications your security team asks about on the first
                call.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6">
                {[
                  ["99.99%", "Uptime SLA"],
                  ["< 100ms", "Median read latency"],
                  ["3", "Data residency regions"],
                  ["24/7", "Security monitoring"],
                ].map(([v, l]) => (
                  <div key={l} className="border-l-[3px] border-signal pl-4">
                    <dt className="tnum font-display text-2xl font-extrabold tracking-tight text-ink">
                      {v}
                    </dt>
                    <dd className="mt-1 text-[13px] text-ink-soft">{l}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {COMPLIANCE.map((c, i) => (
                <Reveal key={c.label} delay={(i % 3) * 0.06} className="h-full">
                  <div className="group flex h-full flex-col justify-between gap-8 rounded-2xl border border-line bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-raised">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-signal-soft text-signal">
                      <c.icon className="size-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-ink">
                        {c.label}
                      </p>
                      <p className="mt-1 text-[12.5px] text-ink-soft">
                        {c.note}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </section>
  );
}
