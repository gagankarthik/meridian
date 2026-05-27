"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Editorial reveal — staggered fade + lift, triggered once on scroll. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "span" | "li" | "h2" | "p";
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const MotionTag = motion[as];
  return (
    <MotionTag
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/* Section eyebrow — the single, consistent label that sits above every
   section heading. Pill-tinted in the brand signal color. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full bg-signal-soft px-3 py-1 text-[12px] font-bold tracking-[0.1em] uppercase text-signal",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* Consistent section container. */
export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-12",
        className,
      )}
    >
      {children}
    </section>
  );
}
