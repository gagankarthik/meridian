"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, GanttChartSquare, Star } from "lucide-react";
import { Avatar } from "@/components/app/widgets";

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

const PROOF = [
  { initials: "DW", hue: "#2563eb" },
  { initials: "MI", hue: "#7a3ff0" },
  { initials: "AK", hue: "#22a06b" },
  { initials: "SM", hue: "#e2a200" },
];

/* Thematic "connected work" network — nodes = tasks, links = dependencies. */
const NODES = [
  { x: 12, y: 30, c: "#2563eb" },
  { x: 26, y: 64, c: "#22a06b" },
  { x: 38, y: 22, c: "#7a3ff0" },
  { x: 52, y: 50, c: "#2563eb" },
  { x: 66, y: 26, c: "#e2a200" },
  { x: 74, y: 62, c: "#06b6d4" },
  { x: 88, y: 38, c: "#22a06b" },
];
const LINKS: [number, number][] = [
  [0, 1], [0, 2], [2, 3], [1, 3], [3, 4], [3, 5], [4, 6], [5, 6],
];

function NetworkBackdrop() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 100 80"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {LINKS.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={NODES[a].x} y1={NODES[a].y}
          x2={NODES[b].x} y2={NODES[b].y}
          stroke="var(--signal)" strokeWidth="0.18" strokeOpacity="0.22"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.3 + i * 0.08, ease }}
        />
      ))}
      {NODES.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r={1.2} fill={n.c}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0.5, 0.9, 0.5], scale: 1 }}
          transition={{
            opacity: { duration: 3.5, repeat: Infinity, delay: i * 0.4 },
            scale: { duration: 0.5, delay: 0.4 + i * 0.08, ease },
          }}
          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
        />
      ))}
    </svg>
  );
}

/* Floating glass product fragments — depth + product hint without a mockup. */
function FloatChip({
  className,
  delay,
  drift = 10,
  children,
}: {
  className: string;
  delay: number;
  drift?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute hidden rounded-2xl border border-line bg-card/85 p-3 shadow-float ring-1 ring-black/[0.03] backdrop-blur-md lg:block ${className}`}
      initial={{ opacity: 0, y: 28, scale: 0.95 }}
      animate={{ opacity: 1, y: [0, -drift, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.7, delay, ease },
        scale: { duration: 0.7, delay, ease },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-44 sm:pb-32">
      {/* ── background: brand aurora + connected-work network ── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="brand-wash absolute inset-0" />
        <div className="absolute left-1/2 top-[-9rem] size-[52rem] -translate-x-1/2 rounded-full bg-signal/14 blur-[150px]" />
        <div className="absolute right-[0%] top-[8%] size-96 rounded-full bg-[#22a06b]/14 blur-[130px]" />
        <div className="absolute left-[-4%] top-[26%] size-96 rounded-full bg-[#e2a200]/12 blur-[130px]" />
        <div className="absolute right-[16%] top-[-2%] size-80 rounded-full bg-[#7a3ff0]/12 blur-[130px]" />
        <div className="absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_38%,black,transparent_80%)]">
          <NetworkBackdrop />
        </div>
      </div>

      {/* floating product fragments */}
      <FloatChip className="left-[6%] top-[34%] xl:left-[11%]" delay={0.6} drift={12}>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-[#22a06b]/12 text-[#22a06b]">
            <Check className="size-4" strokeWidth={2.6} />
          </span>
          <div>
            <p className="text-[12px] font-bold text-ink">Task shipped</p>
            <p className="text-[10.5px] text-ink-soft">Launch checklist</p>
          </div>
        </div>
      </FloatChip>

      <FloatChip className="right-[6%] top-[30%] xl:right-[11%]" delay={0.75} drift={14}>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
          On track · 82%
        </p>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
          <span className="block h-full w-[82%] rounded-full bg-signal" />
        </div>
      </FloatChip>

      <FloatChip className="left-[9%] bottom-[14%] xl:left-[15%]" delay={0.9} drift={10}>
        <div className="flex items-center gap-2.5">
          <span className="flex -space-x-1.5">
            {PROOF.map((p) => (
              <span key={p.initials} className="rounded-full ring-2 ring-card">
                <Avatar initials={p.initials} hue={p.hue} size={22} />
              </span>
            ))}
          </span>
          <span className="text-[12px] font-semibold text-ink">5 collaborators</span>
        </div>
      </FloatChip>

      <FloatChip className="right-[8%] bottom-[12%] xl:right-[14%]" delay={1.0} drift={13}>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-signal/12 text-signal">
            <GanttChartSquare className="size-4" strokeWidth={2} />
          </span>
          <div className="space-y-1">
            {[20, 11, 16].map((w, i) => (
              <span
                key={i}
                className="block h-1.5 rounded-full"
                style={{
                  width: `${w * 4}px`,
                  marginLeft: `${i * 6}px`,
                  background: ["#2563eb", "#1d9aaa", "#e2a200"][i],
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        </div>
      </FloatChip>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-3xl px-5 text-center sm:px-8"
      >
        <motion.span
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3.5 py-1.5 text-[13px] font-semibold text-ink-muted shadow-card backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal/60" />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          Plan, execute & report — one map
        </motion.span>

        <motion.h1
          variants={item}
          className="mt-7 font-display text-[clamp(3rem,8vw,6.25rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink text-balance"
        >
          Ship great work,
          <br />
          <span className="bg-gradient-to-r from-signal via-[#06b6d4] to-[#7a3ff0] bg-clip-text text-transparent">
            not status updates.
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-ink-muted text-pretty"
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
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-signal px-6 py-3.5 text-[15px] font-bold text-white shadow-raised transition-colors hover:bg-signal-strong active:translate-y-px"
          >
            Get started free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/#views"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-card/80 px-6 py-3.5 text-[15px] font-bold text-ink shadow-card backdrop-blur transition-colors hover:border-signal/40 hover:text-signal active:translate-y-px"
          >
            See it in action
          </Link>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-9 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-ink-soft"
        >
          <span className="inline-flex items-center gap-1">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 text-[#e2a200]" fill="#e2a200" strokeWidth={0} />
              ))}
            </span>
            <span className="font-semibold text-ink">4.9</span>
          </span>
          <span>Loved by teams that ship</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
