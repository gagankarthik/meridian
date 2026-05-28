"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Optionally widen the form card (e.g. for the onboarding wizard). */
  wide?: boolean;
};

const PANEL_POINTS = [
  "Boards, timelines, and dashboards in one workspace",
  "Real-time updates the moment your team ships",
  "Enterprise-grade SSO, roles, and audit logs",
];

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
    <main id="main" tabIndex={-1} className="relative grid min-h-dvh bg-paper outline-none lg:grid-cols-[1fr_1.05fr]">
      {/* subtle brand wash on mobile/tablet (the brand panel is desktop-only) */}
      <div
        aria-hidden
        className="brand-wash pointer-events-none absolute inset-0 opacity-70 lg:hidden"
      />

      {/* ---- Left: form column ---- */}
      <div className="relative flex flex-col px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-lg text-ink transition-opacity hover:opacity-80"
          >
            <Wordmark />
          </Link>

          <div
            className={cn(
              "my-auto w-full py-8 sm:py-10",
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

          <footer className="pt-6 text-xs text-ink-soft">
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

          {/* centerpiece: headline + concise value bullets */}
          <div className="max-w-md">
            <h2 className="text-balance text-[2.25rem] leading-[1.08] font-semibold tracking-tight text-white">
              The operating system for ambitious teams.
            </h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-white/80">
              Plan, execute, and report on every project from a single source of
              truth your whole company can trust.
            </p>

            <ul className="mt-9 space-y-4">
              {PANEL_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-white/90">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-[0.97rem] leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* compact, proportioned testimonial card (replaces the oversized art) */}
          <figure className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 shadow-float backdrop-blur-sm">
            <blockquote className="text-[15px] leading-relaxed text-white/90">
              &ldquo;We retired four tools and a quarter of our status meetings —
              leadership finally trusts one place for the real state of
              work.&rdquo;
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-[12px] font-bold text-white ring-1 ring-white/30">
                DW
              </span>
              <span className="text-[12.5px] leading-tight text-white/80">
                <span className="block font-semibold text-white">
                  Dana Whitfield
                </span>
                VP, Program Management
              </span>
            </figcaption>
          </figure>
        </div>
      </aside>
    </main>
  );
}
