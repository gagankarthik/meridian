"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { BoardIllustration } from "@/components/marketing/illustrations";
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
    <main className="grid min-h-dvh bg-paper lg:grid-cols-[1fr_1.05fr]">
      {/* ---- Left: form column ---- */}
      <div className="flex flex-col px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-lg text-ink transition-opacity hover:opacity-80"
          >
            <Wordmark />
          </Link>

          <div
            className={cn(
              "my-auto w-full py-10",
              wide && "max-w-none",
            )}
          >
            <header className="mb-7">
              <h1 className="text-[1.7rem] leading-tight font-semibold tracking-tight text-ink">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                  {subtitle}
                </p>
              ) : null}
            </header>

            {children}
          </div>

          <footer className="pt-6 text-xs text-ink-soft">
            &copy; {new Date().getFullYear()} Meridian, Inc. ·{" "}
            <Link href="/" className="transition-colors hover:text-ink-muted">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/" className="transition-colors hover:text-ink-muted">
              Terms
            </Link>
          </footer>
        </div>
      </div>

      {/* ---- Right: brand panel (desktop only) ---- */}
      <aside className="brand-gradient relative hidden overflow-hidden lg:block">
        {/* atmospheric glows */}
        <div className="pointer-events-none absolute -top-24 -right-16 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Wordmark className="text-white" />

          <div className="max-w-md">
            <h2 className="text-balance text-[2.1rem] leading-[1.1] font-semibold tracking-tight text-white">
              The operating system for ambitious teams.
            </h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-white/80">
              Plan, execute, and report on every project from a single source of
              truth your whole company can trust.
            </p>

            <ul className="mt-8 space-y-3.5">
              {PANEL_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-white/90">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="text-[0.95rem] leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl bg-white/10 p-3 shadow-float ring-1 ring-white/20 backdrop-blur-sm">
              <BoardIllustration className="w-full" />
            </div>
            <p className="mt-5 text-sm text-white/70">
              Trusted by product, design, and engineering teams worldwide.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
