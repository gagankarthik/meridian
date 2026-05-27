import type { ReactNode } from "react";

/* Stylized, professional logo lockups (mark + wordmark) for representative
   customers. Rendered in a single muted ink tone; they colorize on hover. */
type Logo = { name: string; mark: ReactNode };

const stroke = { stroke: "currentColor", strokeWidth: 2, fill: "none" } as const;

const LOGOS: Logo[] = [
  {
    name: "Northwind",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <path d="M4 18V6l8 8 8-8v12" {...stroke} strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Vantage",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <circle cx="12" cy="12" r="9" {...stroke} />
        <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Helios",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <path
          d="M12 3l2.4 5.4L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.6-.6L12 3z"
          {...stroke}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Cobalt",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <rect x="4" y="4" width="16" height="16" rx="4" {...stroke} />
        <path d="M9 9h6v6" {...stroke} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Meriton",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <path d="M3 12h5l2-5 4 10 2-5h5" {...stroke} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Greycliff",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <path d="M12 3l9 16H3L12 3z" {...stroke} strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Axiom",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <path d="M5 19L12 5l7 14" {...stroke} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 14h8" {...stroke} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Lumen",
    mark: (
      <svg viewBox="0 0 24 24" className="size-6">
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...stroke} strokeLinecap="round" />
      </svg>
    ),
  },
];

export function LogoMarquee() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <section className="border-y border-line bg-paper-raised py-10">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 sm:px-8 lg:px-12">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Trusted by modern teams at companies of every size
        </p>
        <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-12 pr-12 group-hover:[animation-play-state:paused]">
            {row.map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="flex shrink-0 items-center gap-2.5 text-ink/40 transition-colors duration-300 hover:text-ink"
              >
                {logo.mark}
                <span className="font-display text-xl font-bold tracking-tight whitespace-nowrap">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
