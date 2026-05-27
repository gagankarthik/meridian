import { cn } from "@/lib/utils";

/**
 * Meridian mark — a globe meridian (outer ring + vertical meridian ellipse)
 * with a single signal dot marking "true north". Strokes use currentColor so
 * the mark inverts cleanly on dark surfaces; the dot stays signal-orange.
 */
export function MeridianMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <ellipse
        cx="12"
        cy="12"
        rx="4"
        ry="9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.55"
      />
      <circle cx="12" cy="3" r="2.1" fill="var(--signal)" />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-display text-[15px] font-extrabold tracking-[0.18em] uppercase",
        className,
      )}
    >
      <MeridianMark className={cn("size-[22px]", markClassName)} />
      Meridian
    </span>
  );
}
