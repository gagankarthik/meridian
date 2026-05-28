import type { ReactNode } from "react";
import { SiteNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";

export type LegalSection = { heading: string; body: ReactNode };

export function LegalShell({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-paper">
      <SiteNav />
      <main id="main" tabIndex={-1} className="mx-auto max-w-[760px] px-5 pb-24 pt-28 outline-none sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          Last updated {updated}
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{intro}</p>

        <div className="mt-10 space-y-9">
          {sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="font-display text-[20px] font-bold tracking-tight text-ink">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-2.5 space-y-3 text-[14.5px] leading-relaxed text-ink-muted">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-line pt-6 text-[13px] text-ink-soft">
          Questions about this policy? Email{" "}
          <a
            href="mailto:legal@meridian.work"
            className="font-semibold text-signal hover:underline"
          >
            legal@meridian.work
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
