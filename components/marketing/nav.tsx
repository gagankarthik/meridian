"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  ChevronDown,
  ClipboardList,
  Code2,
  Columns3,
  FileText,
  GanttChartSquare,
  Megaphone,
  Menu,
  PieChart,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { getCurrentUser } from "aws-amplify/auth";
import { Wordmark } from "@/components/brand/logo";
import { cognitoConfigured } from "@/lib/cognito";
import { cn } from "@/lib/utils";

type MenuItem = { icon: typeof Columns3; label: string; desc: string; href: string };

const MENUS: { label: string; href?: string; cols?: 1 | 2; items?: MenuItem[] }[] = [
  {
    label: "Product",
    cols: 2,
    items: [
      { icon: Columns3, label: "Boards", desc: "Kanban for every team", href: "#views" },
      { icon: GanttChartSquare, label: "Timelines", desc: "Plan across quarters", href: "#views" },
      { icon: PieChart, label: "Dashboards", desc: "Real-time reporting", href: "#views" },
      { icon: Workflow, label: "Automations", desc: "Rules that run for you", href: "#platform" },
      { icon: Blocks, label: "Integrations", desc: "Connect your stack", href: "#platform" },
      { icon: Sparkles, label: "AI planning", desc: "Draft & prioritize", href: "#platform" },
    ],
  },
  {
    label: "Solutions",
    cols: 2,
    items: [
      { icon: Code2, label: "Software development", desc: "Track bugs, ship releases, skip the status meetings.", href: "#workflow" },
      { icon: Megaphone, label: "Marketing", desc: "Plan campaigns, manage creative workflows, and launch on time.", href: "#workflow" },
      { icon: ClipboardList, label: "Project management", desc: "Manage service requests, track incidents, and keep operations running smoothly.", href: "#workflow" },
      { icon: Server, label: "IT", desc: "Coordinate timelines, track deliverables, and ship projects across any team.", href: "#workflow" },
    ],
  },
  {
    label: "Resources",
    cols: 1,
    items: [
      { icon: FileText, label: "Docs", desc: "Guides & API", href: "#" },
      { icon: BarChart3, label: "Changelog", desc: "What's new", href: "#" },
      { icon: ShieldCheck, label: "Security", desc: "Trust & compliance", href: "#security" },
      { icon: Users, label: "Customers", desc: "Stories from teams", href: "#" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reflect auth state so returning users jump straight to their dashboard.
  useEffect(() => {
    if (!cognitoConfigured) return;
    let active = true;
    getCurrentUser()
      .then(() => active && setSignedIn(true))
      .catch(() => active && setSignedIn(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 transition-all duration-300 sm:px-8 lg:px-12",
          scrolled &&
            "h-14 border-b border-line bg-paper/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/70",
        )}
      >
        <Link href="/" className="text-ink">
          <Wordmark />
        </Link>

        <nav className="hidden items-center md:flex">
          {MENUS.map((m) =>
            m.items ? (
              <Dropdown key={m.label} label={m.label} cols={m.cols ?? 1} items={m.items} />
            ) : (
              <a
                key={m.label}
                href={m.href}
                className="px-3 py-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {m.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link
              href="/app"
              className="group inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[14px] font-bold text-white shadow-card transition-colors hover:bg-signal-strong"
            >
              Go to dashboard
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[14px] font-bold text-white shadow-card transition-colors hover:bg-signal-strong"
              >
                Get started free
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-line text-ink md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-b border-line bg-paper px-5 pb-6 pt-2 md:hidden">
          {MENUS.map((m) => (
            <div key={m.label} className="border-b border-line py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                {m.label}
              </p>
              {m.items ? (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {m.items.map((it) => (
                    <a
                      key={it.label}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-2 py-1.5 text-[14px] font-medium text-ink"
                    >
                      {it.label}
                    </a>
                  ))}
                </div>
              ) : (
                <a
                  href={m.href}
                  onClick={() => setOpen(false)}
                  className="mt-1 block text-[14px] font-medium text-ink"
                >
                  Go to {m.label}
                </a>
              )}
            </div>
          ))}
          <div className="mt-4 flex gap-2">
            {signedIn ? (
              <Link
                href="/app"
                className="flex-1 rounded-xl bg-signal py-2.5 text-center text-sm font-bold text-white"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex-1 rounded-xl border border-line py-2.5 text-center text-sm font-semibold"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 rounded-xl bg-signal py-2.5 text-center text-sm font-bold text-white"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Dropdown({
  label,
  cols,
  items,
}: {
  label: string;
  cols: 1 | 2;
  items: MenuItem[];
}) {
  return (
    <div className="group relative">
      <button className="inline-flex items-center gap-1 px-3 py-2 text-[14px] font-medium text-ink-muted transition-colors group-hover:text-ink">
        {label}
        <ChevronDown className="size-3.5 transition-transform duration-300 group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div
          className={cn(
            "grid gap-1 rounded-2xl border border-line bg-popover p-2 shadow-float",
            cols === 2 ? "w-[480px] grid-cols-2" : "w-[280px] grid-cols-1",
          )}
        >
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal">
                <it.icon className="size-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold text-ink">
                  {it.label}
                </span>
                <span className="block text-[12px] text-ink-soft">{it.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
