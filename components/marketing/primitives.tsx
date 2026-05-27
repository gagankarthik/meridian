"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* Editorial reveal — fade + lift, triggered once on scroll. Honors
   prefers-reduced-motion (renders in place, never stuck hidden). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
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
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  return (
    <MotionTag
      ref={ref}
      initial={reduce ? false : { opacity: 0, y }}
      animate={reduce ? undefined : inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/* Stagger container — children (use <RevealItem>) cascade in as the group
   scrolls into view. Gives sections a consistent, flowing entrance. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ staggerChildren: stagger }}
    >
      {children}
    </MotionTag>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag variants={itemVariants} className={className}>
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
