"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Reveal-on-scroll WITHOUT ever shipping hidden content in the SSR HTML.
 *
 * Content renders **visible by default** (`shown` starts true), so the page
 * paints immediately and is never blank while the JS bundle loads — the old
 * `initial={{opacity:0}}` baseline made the whole landing page look like it was
 * "loading as you scroll" on slow mobile. After mount we only hide + animate
 * elements that are still BELOW the fold (off-screen, so the transition is
 * never visible); anything already on screen, reduced-motion users, and the
 * no-JS case all stay fully visible.
 */
function useReveal() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (reduce || typeof IntersectionObserver === "undefined") return;
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    // Already on (or near) screen at mount → leave it shown, no flash.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setShown(false);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduce]);

  return { ref, shown };
}

/* Editorial reveal — fade + lift as it scrolls into view, but never hidden in
   SSR so content always paints. */
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
  const { ref, shown } = useReveal();
  const MotionTag = motion[as];
  return (
    <MotionTag
      ref={ref}
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/* Stagger container — children (use <RevealItem>) cascade in as the group
   scrolls into view. Same SSR-visible guarantee as Reveal. */
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
  const { ref, shown } = useReveal();
  const MotionTag = motion[as];
  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={false}
      animate={shown ? "show" : "hidden"}
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
