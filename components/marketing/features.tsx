import { FEATURES } from "@/lib/site";
import { Reveal, Section } from "./primitives";
import { cn } from "@/lib/utils";

/* Distinct, on-palette tint per card — blue, teal, green, amber, grape, red. */
const TINTS = ["#2563eb", "#1d9aaa", "#22a06b", "#e2a200", "#7a3ff0", "#e34935"];

/* Bento spans (lg): the first feature is a 2×2 spotlight, the rest tile around it. */
const SPANS = ["sm:col-span-2 lg:col-span-2 lg:row-span-2", "", "", "", "", ""];

export function Features() {
  return (
    <Section id="platform" className="py-24 sm:py-32">
      <div className="max-w-2xl">
        <Reveal delay={0.1}>
          <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-extrabold tracking-[-0.025em] text-ink text-balance">
            Everything the work needs. Nothing it doesn&apos;t.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            One platform that scales from a five-person squad to a ten-thousand
            person org — without losing the speed that made you fast.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[minmax(13rem,1fr)]">
        {FEATURES.map((f, i) => {
          const tint = TINTS[i % TINTS.length];
          const big = i === 0;
          return (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.06}
              className={cn("h-full", SPANS[i])}
            >
              <article
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-raised"
                style={{
                  background: big
                    ? `linear-gradient(150deg, color-mix(in srgb, ${tint} 18%, white) 0%, color-mix(in srgb, ${tint} 6%, white) 55%, white 100%)`
                    : `linear-gradient(180deg, color-mix(in srgb, ${tint} 7%, white) 0%, white 42%)`,
                }}
              >
                {/* colored glow */}
                <span
                  className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full blur-3xl"
                  style={{
                    background: `radial-gradient(circle, color-mix(in srgb, ${tint} ${big ? 36 : 22}%, transparent), transparent 70%)`,
                  }}
                />
                {/* top accent */}
                <span
                  className="absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity group-hover:opacity-100"
                  style={{ background: tint }}
                />

                <div
                  className={cn(
                    "relative inline-flex items-center justify-center rounded-xl",
                    big ? "size-14" : "size-12",
                  )}
                  style={{
                    background: `color-mix(in srgb, ${tint} 14%, white)`,
                    color: tint,
                  }}
                >
                  <f.icon className={big ? "size-7" : "size-6"} strokeWidth={1.9} />
                </div>

                <h3
                  className={cn(
                    "relative mt-6 font-bold tracking-tight text-ink",
                    big ? "text-[24px]" : "text-[18px]",
                  )}
                >
                  {f.title}
                </h3>
                <p
                  className={cn(
                    "relative mt-2 leading-relaxed text-ink-muted",
                    big ? "max-w-md text-[15.5px]" : "text-[14.5px]",
                  )}
                >
                  {f.body}
                </p>

                {/* spotlight gets a decorative stacked-rows motif */}
                {big && (
                  <div className="relative mt-auto pt-8">
                    <div className="space-y-2.5">
                      {[100, 78, 56].map((w, r) => (
                        <div key={w} className="flex items-center gap-2.5">
                          <span
                            className="size-2.5 shrink-0 rounded-[3px]"
                            style={{
                              background: `color-mix(in srgb, ${tint} ${90 - r * 22}%, white)`,
                            }}
                          />
                          <span
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${w}%`,
                              background: `color-mix(in srgb, ${tint} ${28 - r * 6}%, white)`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span
                  className="relative mt-5 inline-flex items-center gap-1 text-[13px] font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: tint }}
                >
                  Learn more →
                </span>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
