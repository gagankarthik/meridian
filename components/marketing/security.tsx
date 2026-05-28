import { COMPLIANCE } from "@/lib/site";
import { Reveal, Section } from "./primitives";

const STATS: [string, string][] = [
  ["99.99%", "Uptime SLA"],
  ["<100ms", "Median read latency"],
  ["3", "Data residency regions"],
  ["24/7", "Security monitoring"],
];

export function Security() {
  return (
    <section className="border-y border-line bg-paper-raised">
      <Section id="security" className="scroll-mt-20 py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="mt-5 font-display text-[clamp(2rem,4.2vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
            Enterprise-grade by default,
            <br className="hidden sm:block" /> not by upgrade.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
            Encryption everywhere, granular roles, full audit trails, and the
            certifications your security team asks about on the first call.
          </p>
        </Reveal>

        {/* stat strip */}
        <Reveal delay={0.1} className="mx-auto mt-12 max-w-4xl">
          <dl className="grid grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card sm:grid-cols-4 sm:divide-y-0">
            {STATS.map(([v, l]) => (
              <div key={l} className="px-5 py-7 text-center">
                <dt className="tnum font-display text-[26px] font-extrabold tracking-tight text-ink">
                  {v}
                </dt>
                <dd className="mt-1 text-[13px] text-ink-soft">{l}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* compliance badges */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {COMPLIANCE.slice(0, 3).map((c, i) => (
            <Reveal key={c.label} delay={(i % 3) * 0.05}>
              <span className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-card py-2 pl-2 pr-4 shadow-card transition-colors hover:border-ink/15">
                <span className="grid size-8 place-items-center rounded-full bg-signal-soft text-signal">
                  <c.icon className="size-4" strokeWidth={2} />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-[13px] font-bold text-ink">
                    {c.label}
                  </span>
                  <span className="block text-[11px] text-ink-soft">{c.note}</span>
                </span>
              </span>
            </Reveal>
          ))}
        </div>
      </Section>
    </section>
  );
}
