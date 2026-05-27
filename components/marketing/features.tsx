import { FEATURES } from "@/lib/site";
import { Reveal, Section } from "./primitives";
import { cn } from "@/lib/utils";

/* Distinct, on-palette tint per card — blue, teal, green, amber, grape, red. */
const TINTS = ["#2563eb", "#1d9aaa", "#22a06b", "#e2a200", "#7a3ff0", "#e34935"];

/* First feature is a tall 2×2 spotlight; the rest tile around it for rhythm:
   [ 0 0 ][1]
   [ 0 0 ][2]
   [3][4][5] */
const SPANS = ["sm:col-span-2 lg:col-span-2 lg:row-span-2", "", "", "", "", ""];

/* A dimensional, illustration-style visual built in CSS/SVG (no image assets
   to break): a glossy 3D icon chip floating over a tinted gradient stage with
   layered depth cards and orbiting dots. */
function FeatureArt({
  tint,
  big,
  index,
  children,
}: {
  tint: string;
  big?: boolean;
  index: number;
  children: React.ReactNode;
}) {
  const rot = [-8, 6, -5, 7, -6, 5][index % 6];
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        big ? "min-h-[12rem] flex-1" : "h-36",
      )}
      style={{
        background: `radial-gradient(120% 120% at 30% 15%, color-mix(in srgb, ${tint} 26%, white) 0%, color-mix(in srgb, ${tint} 9%, white) 45%, #ffffff 100%)`,
      }}
    >
      {/* layered depth cards behind the glyph */}
      <div
        className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl"
        style={{
          transform: `translate(-58%, -56%) rotate(${rot}deg)`,
          background: `color-mix(in srgb, ${tint} 16%, white)`,
          boxShadow: `0 18px 36px -16px color-mix(in srgb, ${tint} 50%, transparent)`,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl ring-1 ring-inset ring-white/50"
        style={{
          transform: `translate(-42%, -44%) rotate(${-rot}deg)`,
          background: `color-mix(in srgb, ${tint} 30%, white)`,
          boxShadow: `0 18px 36px -16px color-mix(in srgb, ${tint} 55%, transparent)`,
        }}
      />

      {/* orbiting dots */}
      <span
        className="absolute right-6 top-6 size-2.5 rounded-full"
        style={{ background: tint, opacity: 0.5 }}
      />
      <span
        className="absolute bottom-7 left-8 size-1.5 rounded-full"
        style={{ background: tint, opacity: 0.4 }}
      />
      <span
        className="absolute bottom-10 right-12 size-2 rounded-full bg-white shadow"
      />

      {/* glossy 3D icon chip */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            "relative grid place-items-center rounded-2xl text-white",
            big ? "size-20" : "size-16",
          )}
          style={{
            background: `linear-gradient(145deg, color-mix(in srgb, ${tint} 75%, white) 0%, ${tint} 55%, color-mix(in srgb, ${tint} 80%, black) 100%)`,
            boxShadow: `0 16px 30px -8px color-mix(in srgb, ${tint} 65%, transparent), inset 0 2px 1px rgba(255,255,255,0.55), inset 0 -4px 8px rgba(0,0,0,0.18)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <Section id="platform" className="scroll-mt-20 py-24 sm:py-32">
      <div className="max-w-2xl">
        <Reveal delay={0.1}>
          <p className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-signal">
            The platform
          </p>
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.03] font-extrabold tracking-[-0.03em] text-ink text-balance">
            Everything the work needs.
            <br className="hidden sm:block" /> Nothing it doesn&apos;t.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted text-pretty">
            One platform that scales from a five-person squad to a ten-thousand
            person org — without losing the speed that made you fast.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:auto-rows-[15.5rem] lg:grid-cols-3">
        {FEATURES.map((f, i) => {
          const tint = TINTS[i % TINTS.length];
          const big = i === 0;
          return (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.06}
              className={cn("h-full", SPANS[i])}
            >
              <article className="group flex h-full flex-col gap-5 rounded-2xl border border-line bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-raised">
                <FeatureArt tint={tint} big={big} index={i}>
                  <f.icon className={big ? "size-9" : "size-7"} strokeWidth={1.8} />
                </FeatureArt>

                <div className="flex flex-1 flex-col px-1.5 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                      style={{
                        background: `color-mix(in srgb, ${tint} 12%, white)`,
                        color: tint,
                      }}
                    >
                      {f.meta}
                    </span>
                  </div>
                  <h3
                    className={cn(
                      "mt-3 font-bold tracking-tight text-ink",
                      big ? "text-[24px]" : "text-[18px]",
                    )}
                  >
                    {f.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 leading-relaxed text-ink-muted",
                      big ? "max-w-lg text-[15.5px]" : "text-[14.5px]",
                    )}
                  >
                    {f.body}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
