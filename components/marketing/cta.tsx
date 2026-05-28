"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./primitives";



export function CTA() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <Reveal className="relative mx-auto max-w-[1080px] overflow-hidden rounded-[2rem] border border-line bg-card px-6 py-16 text-center shadow-float sm:px-10 sm:py-20">
        {/* orbit rings + glow, echoing the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {[20, 32, 46, 62].map((rem, i) => (
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
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-signal/[0.08] blur-[110px]"
        />

        <div className="relative">
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink text-balance">
            Put your work on one map.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
            Join the teams that traded tool sprawl for a single source of truth.
            Your workspace is ready in minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-bold text-paper shadow-raised transition-transform hover:scale-[1.02] active:scale-100"
            >
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-xl border border-line bg-card px-6 py-3.5 text-[15px] font-bold text-ink shadow-card transition-colors hover:border-ink/30"
            >
              Talk to sales team
            </Link>
        </div>
        </div>
      </Reveal>
    </section>
  );
}
