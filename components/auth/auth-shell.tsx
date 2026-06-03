"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Optionally widen the form card (e.g. for the onboarding wizard). */
  wide?: boolean;
};

/**
 * Shared split-screen layout for every auth surface.
 *
 * LEFT  — a centered white form card carrying the Meridian wordmark, the page
 *         title/subtitle, and the page-specific {children}.
 * RIGHT — a violet brand panel (hidden below `lg`) with a headline, feature
 *         bullets, and a product illustration.
 *
 * On small screens only the form column is shown, full-width, wordmark on top.
 */
export function AuthShell({ children, title, subtitle, wide }: AuthShellProps) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="relative grid min-h-dvh bg-paper-raised outline-none lg:grid-cols-[1fr_1.05fr] lg:bg-paper"
    >
      {/* subtle brand wash on mobile/tablet (the brand panel is desktop-only) */}
      <div
        aria-hidden
        className="brand-wash pointer-events-none absolute inset-0 lg:hidden"
      />

      {/* ---- Left: form column ---- */}
      <div className="relative flex flex-col px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Link
            href="/"
            className="mx-auto inline-flex w-fit items-center rounded-lg text-ink transition-opacity hover:opacity-80 sm:mx-0"
          >
            <Wordmark />
          </Link>

          {/* On mobile/tablet the form floats in a white card over the tinted
              wash; on desktop the card chrome dissolves into the form column. */}
          <div
            className={cn(
              "my-auto w-full rounded-2xl border border-line bg-paper p-6 shadow-raised",
              "sm:p-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:py-10 lg:shadow-none",
              wide && "max-w-none",
            )}
          >
            <header className="mb-6 sm:mb-7">
              <h1 className="text-[clamp(1.5rem,6vw,1.8rem)] leading-tight font-semibold tracking-tight text-ink text-balance">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted text-pretty">
                  {subtitle}
                </p>
              ) : null}
            </header>

            {children}
          </div>

          <footer className="pt-6 text-center text-xs text-ink-soft sm:text-left">
            &copy; {new Date().getFullYear()} Meridian, Inc. ·{" "}
            <Link href="/privacy" className="transition-colors hover:text-ink-muted">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="transition-colors hover:text-ink-muted">
              Terms
            </Link>
          </footer>
        </div>
      </div>

      {/* ---- Right: brand panel (desktop only) ---- */}
      <aside className="brand-gradient relative hidden overflow-hidden lg:block">
        {/* atmospheric glows */}
        <div className="pointer-events-none absolute -top-28 -right-20 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-7rem] left-[-5rem] size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Wordmark className="text-white" />

          {/* centerpiece: concise headline + product illustration */}
          <div className="flex flex-1 flex-col justify-center py-10">
            <h2 className="max-w-md text-balance text-[2.25rem] leading-[1.08] font-semibold tracking-tight text-white">
              The operating system for ambitious teams.
            </h2>
            <BrandIllustration className="mt-10 w-full max-w-xl" />
          </div>

          <p className="text-[0.95rem] leading-relaxed text-white/70">
            Boards, timelines, and dashboards — one source of truth your whole
            company can trust.
          </p>
        </div>
      </aside>
    </main>
  );
}

/**
 * Abstract product illustration for the brand panel — a translucent dashboard
 * window (analytics + bar chart) with a floating kanban ticket and an avatar
 * stack for depth. Pure SVG, drawn in white/translucent tones so it sits
 * cleanly on the brand gradient at any viewport width.
 */
function BrandIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 360"
      fill="none"
      role="img"
      aria-label="Illustration of a Meridian project dashboard"
      className={className}
    >
      <defs>
        <filter
          id="auth-illo-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="150%"
        >
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="22"
            floodColor="#0b1f4d"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      {/* main dashboard window */}
      <g filter="url(#auth-illo-shadow)">
        <rect
          x="48"
          y="56"
          width="360"
          height="252"
          rx="22"
          fill="white"
          fillOpacity="0.12"
        />
        <rect
          x="48.5"
          y="56.5"
          width="359"
          height="251"
          rx="21.5"
          stroke="white"
          strokeOpacity="0.25"
        />
      </g>

      {/* window top bar */}
      <circle cx="78" cy="86" r="5" fill="white" fillOpacity="0.55" />
      <circle cx="96" cy="86" r="5" fill="white" fillOpacity="0.3" />
      <circle cx="114" cy="86" r="5" fill="white" fillOpacity="0.3" />
      <line
        x1="48"
        y1="112"
        x2="408"
        y2="112"
        stroke="white"
        strokeOpacity="0.14"
      />

      {/* sidebar */}
      <rect x="48" y="112" width="84" height="196" fill="white" fillOpacity="0.05" />
      <rect x="68" y="136" width="44" height="8" rx="4" fill="white" fillOpacity="0.45" />
      <rect x="68" y="158" width="36" height="8" rx="4" fill="white" fillOpacity="0.22" />
      <rect x="68" y="180" width="40" height="8" rx="4" fill="white" fillOpacity="0.22" />
      <rect x="68" y="202" width="30" height="8" rx="4" fill="white" fillOpacity="0.22" />

      {/* heading + KPI row */}
      <rect x="156" y="134" width="120" height="12" rx="6" fill="white" fillOpacity="0.5" />
      <rect x="156" y="156" width="72" height="8" rx="4" fill="white" fillOpacity="0.25" />

      {/* bar chart */}
      <line
        x1="156"
        y1="282"
        x2="384"
        y2="282"
        stroke="white"
        strokeOpacity="0.18"
      />
      <rect x="166" y="232" width="26" height="50" rx="5" fill="white" fillOpacity="0.3" />
      <rect x="206" y="206" width="26" height="76" rx="5" fill="white" fillOpacity="0.45" />
      <rect x="246" y="248" width="26" height="34" rx="5" fill="white" fillOpacity="0.3" />
      <rect x="286" y="190" width="26" height="92" rx="5" fill="white" fillOpacity="0.85" />
      <rect x="326" y="222" width="26" height="60" rx="5" fill="white" fillOpacity="0.3" />

      {/* floating kanban ticket (top-right) */}
      <g filter="url(#auth-illo-shadow)">
        <rect
          x="330"
          y="34"
          width="158"
          height="96"
          rx="16"
          fill="white"
          fillOpacity="0.92"
        />
      </g>
      <rect x="348" y="54" width="40" height="8" rx="4" fill="#2563eb" fillOpacity="0.85" />
      <rect x="348" y="74" width="104" height="7" rx="3.5" fill="#0b1f4d" fillOpacity="0.5" />
      <rect x="348" y="90" width="82" height="7" rx="3.5" fill="#0b1f4d" fillOpacity="0.32" />
      <circle cx="354" cy="112" r="9" fill="#06b6d4" fillOpacity="0.9" />
      <circle cx="370" cy="112" r="9" fill="#2563eb" fillOpacity="0.9" />

      {/* floating avatar/progress card (bottom-left) */}
      <g filter="url(#auth-illo-shadow)">
        <rect
          x="30"
          y="252"
          width="186"
          height="78"
          rx="16"
          fill="white"
          fillOpacity="0.92"
        />
      </g>
      <circle cx="62" cy="291" r="14" fill="#2563eb" fillOpacity="0.9" />
      <circle cx="84" cy="291" r="14" fill="#06b6d4" fillOpacity="0.9" />
      <circle cx="106" cy="291" r="14" fill="#0b1f4d" fillOpacity="0.55" />
      <rect x="132" y="278" width="64" height="9" rx="4.5" fill="#0b1f4d" fillOpacity="0.5" />
      <rect x="132" y="296" width="44" height="8" rx="4" fill="#0b1f4d" fillOpacity="0.3" />
    </svg>
  );
}
