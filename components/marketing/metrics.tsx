"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { METRICS } from "@/lib/site";

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [n, setN] = useState(0);
  const decimals = value % 1 !== 0 ? (value.toString().split(".")[1]?.length ?? 1) : 0;

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tnum">
      {n.toFixed(decimals)}
      <span className="text-signal">{suffix}</span>
    </span>
  );
}

export function Metrics() {
  return (
    <section id="metrics" className="scroll-mt-20 border-y border-line bg-paper-raised">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-paper-raised px-6 py-12 text-center sm:py-16">
            <p className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-none font-extrabold tracking-tight text-ink">
              <CountUp value={m.value} suffix={m.suffix} />
            </p>
            <p className="mx-auto mt-4 max-w-[14rem] text-[13px] leading-snug text-ink-muted">
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
