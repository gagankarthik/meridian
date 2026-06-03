"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Mail, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/app/widgets";
import { LOGO_MARKS } from "./logo-marks";

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
// Transform-only entrance: the hero text/CTAs are ALWAYS visible in the SSR HTML
// (no opacity:0 baseline), so on slow mobile the page paints immediately instead
// of waiting on the motion bundle to hydrate. It just lifts into place.
const item = {
  hidden: { y: 22 },
  show: { y: 0, transition: { duration: 0.7, ease } },
};

/* chip positions around the orbit rings (desktop only) */
const CHIP_POS = [
  "left-[23%] top-[22%]",
  "left-[13%] top-[40%]",
  "left-[27%] top-[49%]",
  "left-[11%] top-[57%]",
  "left-[27%] top-[69%]",
  "right-[23%] top-[22%]",
  "right-[13%] top-[40%]",
  "right-[27%] top-[49%]",
  "right-[27%] top-[69%]",
];

function LogoChip({ pos, mark, i }: { pos: string; mark: React.ReactNode; i: number }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-[1] hidden -translate-x-1/2 -translate-y-1/2 lg:block ${pos}`}
    >
      <motion.div
        className="pointer-events-auto grid size-14 cursor-pointer place-items-center rounded-full border border-line bg-card shadow-float ring-1 ring-black/[0.04]"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1, y: reduce ? 0 : [0, -8, 0] }}
        whileHover={{ scale: 1.14 }}
        transition={{
          opacity: { duration: 0.5, delay: 0.25 + i * 0.06, ease },
          scale: { duration: 0.5, delay: 0.25 + i * 0.06, ease },
          y: { duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
        }}
      >
        <span className="grid size-7 place-items-center [&>svg]:size-full">
          {mark}
        </span>
      </motion.div>
    </div>
  );
}

/* Faint concentric "orbit" rings centered behind the hero. */
function OrbitRings() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[40%] hidden -translate-x-1/2 -translate-y-1/2 sm:block"
    >
      {[26, 40, 54, 68, 82].map((rem, i) => (
        <div
          key={rem}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${rem}rem`,
            height: `${rem}rem`,
            borderColor:
              i === 0
                ? "color-mix(in srgb, var(--signal) 16%, transparent)"
                : "color-mix(in srgb, var(--ink) 7%, transparent)",
          }}
        />
      ))}
    </div>
  );
}

/* Floating activity card — a real product glimpse, not a full mockup. */
function ActivityCard() {
  return (
    <motion.div
      initial={{ y: 28 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease, delay: 0.5 }}
      className="relative mx-auto mt-12 w-full max-w-md"
    >
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-signal/15 via-[#06b6d4]/10 to-[#7a3ff0]/15 blur-2xl" />

      <div className="overflow-hidden rounded-2xl border border-line bg-card p-2.5 shadow-float ring-1 ring-black/[0.03]">
        {/* row 1 — elevated */}
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3 shadow-card">
          <Avatar initials="WC" hue="#2563eb" size={34} />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[13px] text-ink">
              <span className="font-bold">Wei Chen</span> joined{" "}
              <span className="font-bold">Final Presentation</span>
            </p>
            <p className="text-[11px] text-ink-soft">8 min ago · Q3 Launch</p>
          </div>
          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-signal text-[9px] font-bold text-white">
            ✓
          </span>
        </div>

        {/* row 2 */}
        <div className="mt-1.5 flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-paper-raised">
          <Avatar initials="MJ" hue="#22a06b" size={32} />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[13px] font-bold text-ink">Matthew Johnson</p>
            <p className="truncate text-[11px] text-ink-soft">Content Writer · @meridian</p>
          </div>
          <MoreHorizontal className="size-4 shrink-0 text-ink-soft" />
        </div>

        {/* row 3 */}
        <div className="mt-1 flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-paper-raised">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#ea4335]/10 text-[#ea4335]">
            <Mail className="size-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[13px] font-bold text-ink">Terry Lipshutz</p>
            <p className="truncate text-[11px] text-ink-soft">
              Approved the design of the iOS app…
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
      {/* background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <OrbitRings />
        <div className="absolute left-1/2 top-[34%] size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/[0.05] blur-[120px]" />
      </div>

      {/* orbiting logo chips */}
      {CHIP_POS.map((pos, i) => (
        <LogoChip key={i} pos={pos} mark={LOGO_MARKS[i]} i={i} />
      ))}

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-[2] mx-auto max-w-2xl px-5 text-center sm:px-8"
      >
        {/* headline */}
        <motion.h1
          variants={item}
          className="font-display text-[clamp(2.6rem,6.5vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink text-balance"
        >
          Plan, track, and
          <br className="hidden sm:block" /> ship great work.
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty"
        >
          From small tasks to complex programs, manage everything in one place
          and keep your team moving forward.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={item}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-bold text-paper shadow-raised transition-transform hover:scale-[1.02] active:scale-100"
          >
            Get started free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-[15px] font-bold text-ink shadow-card transition-colors hover:border-ink/30"
          >
            Talk to sales team
          </Link>
        </motion.div>

        {/* activity card */}
        <ActivityCard />
      </motion.div>
    </section>
  );
}
