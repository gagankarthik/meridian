import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MeridianMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-paper px-5 text-center">
      {/* soft brand wash */}
      <div
        aria-hidden
        className="brand-wash pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent_80%)]"
      />

      <div className="relative">
        <MeridianMark className="mx-auto size-12 text-ink" />

        <p className="mt-7 font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-signal">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.75rem,12vw,6rem)] leading-none font-extrabold tracking-tight text-ink">
          Page not found
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted text-pretty">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have
          moved. Let&rsquo;s get you back on track.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl bg-signal px-6 py-3.5 text-[15px] font-bold text-white shadow-raised transition-colors hover:bg-signal-strong active:translate-y-px"
          >
            Back to home
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-[15px] font-bold text-ink shadow-card transition-colors hover:border-signal/40 hover:text-signal active:translate-y-px"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
