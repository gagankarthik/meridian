"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, GanttChartSquare, Sparkles, Star } from "lucide-react";
import { Avatar } from "@/components/app/widgets";

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const PROOF = [
  { initials: "DW", hue: "#2563eb" },
  { initials: "MI", hue: "#7a3ff0" },
  { initials: "AK", hue: "#22a06b" },
  { initials: "SM", hue: "#e2a200" },
];

/* KPI tiles inside the preview — colorful, on brand. */
const PREVIEW_KPIS = [
  { label: "Active", value: "14", tint: "#2563eb" },
  { label: "Shipped", value: "128", tint: "#22a06b" },
  { label: "At risk", value: "3", tint: "#e2a200" },
];
const BARS = [42, 58, 36, 72, 54, 88, 64, 96];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-24 sm:pt-36">
      {/* ── background: multi-color wash, not just blue ── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="brand-wash absolute inset-0" />
        <div className="absolute left-1/2 top-[-6rem] size-[46rem] -translate-x-1/2 rounded-full bg-signal/12 blur-[130px]" />
        <div className="absolute right-[4%] top-[14%] size-80 rounded-full bg-[#22a06b]/12 blur-[110px]" />
        <div className="absolute left-[2%] top-[30%] size-80 rounded-full bg-[#e2a200]/12 blur-[110px]" />
        <div className="absolute right-[18%] top-[2%] size-72 rounded-full bg-[#7a3ff0]/10 blur-[110px]" />
        <div className="bg-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent_75%)]" />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-3xl px-5 text-center sm:px-8"
      >
        {/* badge */}
        <motion.div variants={item} className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/80 py-1.5 pl-2 pr-3.5 text-[13px] font-semibold text-ink-muted shadow-card backdrop-blur">
            <span className="inline-flex items-center gap-1 rounded-full bg-signal-soft px-2 py-0.5 text-[11px] font-bold text-signal">
              <Sparkles className="size-3" strokeWidth={2.4} />
              New
            </span>
            <GanttChartSquare className="size-3.5 text-signal" />
            Gantt timelines are here
          </span>
        </motion.div>

        {/* headline with gradient accent */}
        <motion.h1
          variants={item}
          className="mt-6 font-display text-[clamp(2.75rem,6.5vw,5rem)] font-extrabold leading-[1.0] tracking-[-0.035em] text-ink text-balance"
        >
          Plan, track, and{" "}
          <span className="bg-gradient-to-r from-signal via-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent">
            ship great work.
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-ink-muted"
        >
          From small tasks to complex programs, Meridian brings planning,
          execution, and reporting into one place — and keeps every team moving
          forward.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-xl bg-signal px-6 py-3.5 text-[15px] font-bold text-white shadow-raised transition-colors hover:bg-signal-strong"
          >
            Get started free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#views"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-[15px] font-bold text-ink shadow-card transition-colors hover:border-signal/40 hover:text-signal"
          >
            Talk to sales
          </Link>
        </motion.div>

        {/* social proof */}
        <motion.div
          variants={item}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-ink-soft"
        >
          <span className="flex -space-x-2">
            {PROOF.map((p) => (
              <span key={p.initials} className="rounded-full ring-2 ring-paper">
                <Avatar initials={p.initials} hue={p.hue} size={28} />
              </span>
            ))}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-3.5 text-[#e2a200]"
                  fill="#e2a200"
                  strokeWidth={0}
                />
              ))}
            </span>
            <span className="font-semibold text-ink">4.9</span>
          </span>
          <span>Loved by 12,000+ teams</span>
        </motion.div>
      </motion.div>

      {/* ── product preview mockup ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.35 }}
        className="relative mx-auto mt-16 max-w-5xl px-5 sm:px-8"
      >
        {/* glow */}
        <div className="pointer-events-none absolute -inset-x-10 -top-6 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-signal/15 via-[#06b6d4]/10 to-[#7a3ff0]/12 blur-2xl" />

        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-float ring-1 ring-black/[0.03]">
          {/* browser bar */}
          <div className="flex items-center gap-2 border-b border-line bg-paper-raised px-4 py-3">
            <span className="flex gap-1.5">
              <span className="size-3 rounded-full bg-[#e34935]/70" />
              <span className="size-3 rounded-full bg-[#e2a200]/70" />
              <span className="size-3 rounded-full bg-[#22a06b]/70" />
            </span>
            <span className="mx-auto hidden items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1 font-mono text-[11px] text-ink-soft sm:flex">
              app.meridian.com/dashboard
            </span>
          </div>

          {/* faux dashboard */}
          <div className="flex">
            {/* mini sidebar */}
            <div className="hidden w-44 shrink-0 flex-col gap-1.5 border-r border-line bg-sidebar/60 p-4 sm:flex">
              <div className="mb-2 h-2.5 w-20 rounded-full bg-ink/15" />
              {[
                "#2563eb",
                "#8b909c",
                "#8b909c",
                "#8b909c",
                "#8b909c",
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <span className="size-3 rounded-[5px]" style={{ background: c, opacity: i === 0 ? 1 : 0.35 }} />
                  <span className="h-2 flex-1 rounded-full" style={{ background: c, opacity: i === 0 ? 0.5 : 0.18 }} />
                </div>
              ))}
            </div>

            {/* main */}
            <div className="min-w-0 flex-1 p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {PREVIEW_KPIS.map((k) => (
                  <div
                    key={k.label}
                    className="rounded-xl border border-line p-3 sm:p-4"
                    style={{
                      background: `linear-gradient(180deg, color-mix(in srgb, ${k.tint} 8%, white), white)`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: k.tint }} />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                        {k.label}
                      </span>
                    </div>
                    <p className="tnum mt-1.5 font-display text-2xl font-extrabold tracking-tight text-ink">
                      {k.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* mini chart */}
              <div className="mt-4 rounded-xl border border-line bg-paper-raised/60 p-4 sm:mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="h-2.5 w-24 rounded-full bg-ink/12" />
                  <span className="h-2.5 w-12 rounded-full bg-signal/30" />
                </div>
                <div className="flex h-28 items-end gap-2 sm:gap-3">
                  {BARS.map((h, i) => {
                    const last = i === BARS.length - 1;
                    return (
                      <div key={i} className="flex flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t-md"
                          style={{
                            height: `${h}%`,
                            background: last ? "var(--signal)" : "color-mix(in srgb, var(--ink) 78%, white)",
                            opacity: last ? 1 : 0.85,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
