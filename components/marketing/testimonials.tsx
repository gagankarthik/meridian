import { TESTIMONIALS } from "@/lib/site";
import { Reveal, Section } from "./primitives";

export function Testimonials() {
  return (
    <Section className="py-24 sm:py-32">
      <Reveal delay={0.05}>
        <h2 className="mt-5 max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink text-balance">
          Teams ship more with Meridian.
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08} className="h-full">
            <figure className="flex h-full flex-col rounded-2xl border border-line bg-card p-8 shadow-card transition-shadow hover:shadow-raised sm:p-10">
              <span className="font-display text-5xl leading-none font-extrabold text-signal">
                &ldquo;
              </span>
              <blockquote className="mt-4 flex-1 text-[clamp(1.15rem,1.8vw,1.5rem)] leading-snug font-semibold tracking-[-0.01em] text-ink text-balance">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-6">
                <span className="grid size-11 place-items-center rounded-full bg-signal text-[13px] font-bold text-white">
                  {t.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </span>
                <div>
                  <p className="text-[14px] font-bold text-ink">{t.name}</p>
                  <p className="text-[12.5px] text-ink-soft">
                    {t.role} · {t.company}
                  </p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
