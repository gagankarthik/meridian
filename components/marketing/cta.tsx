"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { MeridianMark } from "@/components/brand/logo";

const ease = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

/* Abstract connected-nodes + chart illustration. Pure inline SVG, white-on-
   gradient — reads as "your work, mapped onto one surface". */
function ConnectedNodes({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 280"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cta-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* connecting links */}
      <g stroke="url(#cta-stroke)" strokeWidth="2" strokeLinecap="round">
        <line x1="60" y1="64" x2="160" y2="120" />
        <line x1="160" y1="120" x2="264" y2="56" />
        <line x1="160" y1="120" x2="92" y2="214" />
        <line x1="160" y1="120" x2="246" y2="196" />
        <line x1="92" y1="214" x2="246" y2="196" />
      </g>

      {/* mini bar chart inside the central hub */}
      <g>
        <circle
          cx="160"
          cy="120"
          r="40"
          fill="#ffffff"
          fillOpacity="0.14"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="2"
        />
        <g fill="#ffffff">
          <rect x="143" y="128" width="7" height="14" rx="2" fillOpacity="0.75" />
          <rect x="156" y="118" width="7" height="24" rx="2" fillOpacity="0.95" />
          <rect x="169" y="110" width="7" height="32" rx="2" fillOpacity="0.85" />
        </g>
      </g>

      {/* outer satellite nodes */}
      <g fill="#ffffff">
        <circle cx="60" cy="64" r="13" fillOpacity="0.9" />
        <circle cx="264" cy="56" r="11" fillOpacity="0.8" />
        <circle cx="92" cy="214" r="12" fillOpacity="0.85" />
        <circle cx="246" cy="196" r="14" fillOpacity="0.92" />
      </g>

      {/* small check + plus marks for texture */}
      <g stroke="#1d9aaa" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M55 64l3.5 3.5L66 60" />
      </g>
      <g stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round">
        <path d="M242 196h8M246 192v8" />
      </g>
    </svg>
  );
}

export function CTA() {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
        transition={{ staggerChildren: 0.08 }}
        className="brand-gradient relative mx-auto max-w-[1240px] overflow-hidden rounded-3xl px-6 py-20 text-white shadow-float sm:px-12 sm:py-24 lg:py-28"
      >
        {/* soft glow blobs */}
        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
          className="pointer-events-none absolute -right-16 -top-24 size-[28rem] rounded-full bg-white/15 blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 15, ease: "easeInOut", repeat: Infinity }}
          className="pointer-events-none absolute -bottom-24 -left-16 size-[26rem] rounded-full bg-white/10 blur-[110px]"
        />
        <div className="pointer-events-none absolute right-[12%] top-[18%] size-44 rounded-full bg-[#06b6d4]/25 blur-[80px]" />
        <MeridianMark className="pointer-events-none absolute -bottom-14 -left-8 size-72 text-white/[0.08]" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="text-center lg:text-left">
            <motion.span
              variants={reveal}
              transition={{ duration: 0.7, ease }}
              className="inline-flex items-center gap-2.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold tracking-[0.1em] uppercase text-white ring-1 ring-white/20"
            >
              Find your bearing
            </motion.span>
            <motion.h2
              variants={reveal}
              transition={{ duration: 0.7, ease }}
              className="mt-6 font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance"
            >
              Put your work on one map.
            </motion.h2>
            <motion.p
              variants={reveal}
              transition={{ duration: 0.7, ease }}
              className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-white/80 lg:mx-0"
            >
              Join the teams that traded tool sprawl for a single source of
              truth. Free for 14 days — your workspace is ready in minutes.
            </motion.p>
            <motion.div
              variants={reveal}
              transition={{ duration: 0.7, ease }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Link
                href="/app"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-bold text-signal shadow-raised transition-transform hover:scale-[1.02]"
              >
                Get it free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
              >
                Book a demo
              </Link>
            </motion.div>
          </div>

          {/* decorative illustration */}
          <motion.div
            variants={reveal}
            transition={{ duration: 0.9, ease }}
            className="relative hidden justify-self-center lg:block"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
            >
              <ConnectedNodes className="w-full max-w-sm drop-shadow-[0_18px_40px_rgba(0,0,0,0.18)]" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
