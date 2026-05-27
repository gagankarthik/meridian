import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";

type FooterLink = { label: string; href: string };
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Boards", href: "/#views" },
      { label: "Timelines", href: "/#views" },
      { label: "Dashboards", href: "/#views" },
      { label: "Automations", href: "/#workflow" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Engineering", href: "/#workflow" },
      { label: "Marketing", href: "/#workflow" },
      { label: "Operations", href: "/#workflow" },
      { label: "Agencies", href: "/#use-cases" },
      { label: "Enterprise", href: "/#security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#metrics" },
      { label: "Customers", href: "/#testimonials" },
      { label: "Contact", href: "mailto:support@meridian.work" },
      { label: "Sign in", href: "/login" },
      { label: "Get started", href: "/signup" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Security", href: "/#security" },
      { label: "Pricing", href: "/pricing" },
      { label: "Help", href: "/app/help" },
      { label: "Status", href: "/#metrics" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-raised">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-10 py-16 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="text-ink">
              <Wordmark />
            </Link>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-ink-muted">
              The operating system for ambitious teams. Plan, execute, and
              report on every project from one map.
            </p>
            <div className="mt-6 flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase text-ink-soft">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[13px] font-bold text-ink">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-line py-7 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] tracking-wide text-ink-soft">
            © {new Date().getFullYear()} Meridian Labs, Inc. — Built for teams
            that ship.
          </p>
          <div className="flex items-center gap-5 font-mono text-[11px] tracking-wide text-ink-soft">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-ink">
              DPA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
