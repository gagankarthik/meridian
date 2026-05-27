"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

/* What you get — real product facts, numbered like the rest of the site. */
const INCLUDED = [
  { n: "01", label: "Boards, tables & timelines" },
  { n: "02", label: "Dashboards & live reporting" },
  { n: "03", label: "Approvals, roles & access" },
  { n: "04", label: "Free to start — no credit card" },
];

const ACCENT = "#7aa2ff"; // readable blue on the ink panel

export function CTA() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 0.7, ease }}
        className="mx-auto grid max-w-[1240px] overflow-hidden rounded-[1.75rem] bg-ink text-paper shadow-float lg:grid-cols-[1.15fr_0.85fr]"
      >
        {/* LEFT — the statement */}
        <div className="border-b border-white/10 p-9 sm:p-12 lg:border-b-0 lg:border-r lg:p-14">
          <p
            className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: ACCENT }}
          >
            Get started
          </p>
          <h2 className="mt-5 max-w-xl font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.0] font-extrabold tracking-[-0.035em] text-balance">
            Put your work on one map.
          </h2>
          <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-paper/70">
            Join the teams that traded tool sprawl for a single source of truth.
            Your workspace is ready in minutes.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-signal px-6 py-3.5 text-[15px] font-bold text-white shadow-raised transition-colors hover:bg-signal-strong active:translate-y-px"
            >
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="mailto:sales@meridian.work"
              className="text-[15px] font-semibold text-paper/80 underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              Talk to sales
            </Link>
          </div>
        </div>

        {/* RIGHT — structured "what's included", hairline-divided */}
        <div className="flex flex-col justify-center p-9 sm:p-12 lg:p-12">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/45">
            Everything included
          </p>
          <ul className="divide-y divide-white/10">
            {INCLUDED.map((it) => (
              <li key={it.n} className="flex items-baseline gap-4 py-4">
                <span
                  className="font-mono text-[12px] font-bold"
                  style={{ color: ACCENT }}
                >
                  {it.n}
                </span>
                <span className="text-[15px] font-medium text-paper/90">
                  {it.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
