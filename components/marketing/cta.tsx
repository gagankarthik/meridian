"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { MeridianMark } from "@/components/brand/logo";

const ease = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const TRUST = ["Free to start", "No credit card", "Set up in minutes"];

export function CTA() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ staggerChildren: 0.08 }}
        className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white shadow-float sm:px-12 sm:py-28"
        style={{
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #2563eb 40%, #0e7490 100%)",
        }}
      >
        {/* aurora depth */}
        <motion.div
          animate={{ y: [0, -22, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 13, ease: "easeInOut", repeat: Infinity }}
          className="pointer-events-none absolute -right-20 -top-28 size-[30rem] rounded-full bg-[#06b6d4]/40 blur-[120px]"
        />
        <motion.div
          animate={{ y: [0, 22, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
          className="pointer-events-none absolute -bottom-28 -left-20 size-[28rem] rounded-full bg-[#7a3ff0]/35 blur-[130px]"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[120px]" />

        {/* fine noise for texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* brand watermark */}
        <MeridianMark className="pointer-events-none absolute -bottom-16 -left-10 size-80 text-white/[0.07]" />
        <MeridianMark className="pointer-events-none absolute -right-12 -top-16 size-64 text-white/[0.06]" />

        <div className="relative mx-auto max-w-2xl">
          <motion.h2
            variants={reveal}
            transition={{ duration: 0.7, ease }}
            className="font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance"
          >
            Put your work on one map.
          </motion.h2>

          <motion.p
            variants={reveal}
            transition={{ duration: 0.7, ease }}
            className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-white/85 text-pretty"
          >
            Join the teams that traded tool sprawl for a single source of truth.
            Your workspace is ready in minutes.
          </motion.p>

          <motion.div
            variants={reveal}
            transition={{ duration: 0.7, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-bold text-[#1e3a8a] shadow-raised transition-transform hover:scale-[1.02] active:scale-100"
            >
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="mailto:sales@meridian.work"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-7 py-3.5 text-[15px] font-bold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Talk to sales
            </Link>
          </motion.div>

          {/* trust microline */}
          <motion.ul
            variants={reveal}
            transition={{ duration: 0.7, ease }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-white/75"
          >
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-white" strokeWidth={2.6} />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  );
}
