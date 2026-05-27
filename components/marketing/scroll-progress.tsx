"use client";

import { motion, useScroll, useSpring } from "motion/react";

/* Spring-eased reading-progress bar pinned to the top — a hallmark of a
   polished motion site, and useful orientation as you scroll the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-signal via-[#06b6d4] to-[#7a3ff0]"
    />
  );
}
