"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { AnimatePresence, motion } from "motion/react";
import { getCurrentUser } from "aws-amplify/auth";
import { Wordmark } from "@/components/brand/logo";
import { cognitoConfigured } from "@/lib/cognito";
import { cn } from "@/lib/utils";

// Distinct soft tints for the icon tiles. Each maps to an app accent token and
// renders as a soft tinted background + colored glyph (works in light + dark).
type Tint = "signal" | "grape" | "teal" | "green" | "yellow";

const TINT: Record<Tint, string> = {
  signal: "bg-signal-soft text-signal",
  grape: "bg-grape/12 text-grape",
  teal: "bg-teal/12 text-teal",
  green: "bg-green/12 text-green",
  yellow: "bg-yellow/15 text-yellow",
};

type MenuItem = {
  icon: typeof Columns3;
  label: string;
  desc: string;
  href: string;
  tint: Tint;
};

type Menu = {
  label: string;
  href?: string;
  cols?: 1 | 2;
  items?: MenuItem[];
  // Optional footer strip ("banner" feel) shown inside 2-column panels.
  cta?: { label: string; href: string };
};

const MENUS: Menu[] = [
  {
    label: "Product",
    cols: 2,
    cta: { label: "See everything in the platform", href: "/#platform" },
    items: [
      { icon: Columns3, label: "Boards", desc: "Kanban for every team", href: "/#views", tint: "signal" },
      { icon: GanttChartSquare, label: "Timelines", desc: "Plan across quarters", href: "/#views", tint: "grape" },
      { icon: PieChart, label: "Dashboards", desc: "Real-time reporting", href: "/#views", tint: "teal" },
      { icon: Workflow, label: "Workflow", desc: "Intake to outcome", href: "/#workflow", tint: "green" },
      { icon: Blocks, label: "Capabilities", desc: "Everything the work needs", href: "/#platform", tint: "yellow" },
      { icon: Sparkles, label: "Roadmap", desc: "Plan across quarters", href: "/#workflow", tint: "signal" },
    ],
  },
  {
    label: "Solutions",
    cols: 2,
    cta: { label: "Explore all use cases", href: "/#use-cases" },
    items: [
      { icon: Code2, label: "Software development", desc: "Track bugs, ship releases, skip the status meetings.", href: "/#use-cases", tint: "signal" },
      { icon: Megaphone, label: "Marketing", desc: "Plan campaigns, manage creative workflows, and launch on time.", href: "/#use-cases", tint: "grape" },
      { icon: ClipboardList, label: "Project management", desc: "Manage requests, track incidents, and keep operations running smoothly.", href: "/#use-cases", tint: "teal" },
      { icon: Server, label: "IT", desc: "Coordinate timelines, track deliverables, and ship projects across any team.", href: "/#use-cases", tint: "green" },
    ],
  },
  {
    label: "Resources",
    cols: 1,
    items: [
      { icon: FileText, label: "Help center", desc: "Guides & answers", href: "/app/help", tint: "signal" },
      { icon: BarChart3, label: "Customers", desc: "Stories from teams", href: "/#testimonials", tint: "teal" },
      { icon: ShieldCheck, label: "Security", desc: "Trust & compliance", href: "/#security", tint: "green" },
      { icon: Users, label: "Pricing", desc: "Plans for every team", href: "/pricing", tint: "grape" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  // Which desktop dropdown is open (by label); only one at a time.
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

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

  // Close the open desktop dropdown on click-outside or Escape.
  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-line bg-paper/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/70"
          : "border-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1240px] items-center justify-between px-5 transition-all duration-300 sm:px-8 lg:px-12",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link href="/" className="text-ink">
          <Wordmark />
        </Link>

        <nav ref={navRef} aria-label="Primary" className="hidden items-center md:flex">
          {MENUS.map((m) =>
            m.items ? (
              <Dropdown
                key={m.label}
                label={m.label}
                cols={m.cols ?? 1}
                items={m.items}
                cta={m.cta}
                isOpen={openMenu === m.label}
                onOpen={() => setOpenMenu(m.label)}
                onClose={() => setOpenMenu((cur) => (cur === m.label ? null : cur))}
                onToggle={() =>
                  setOpenMenu((cur) => (cur === m.label ? null : m.label))
                }
              />
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
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-b border-line bg-paper md:hidden"
          >
            <div className="max-h-[80vh] overflow-y-auto px-5 pb-6 pt-2">
              {MENUS.map((m) =>
                m.items ? (
                  <MobileAccordion
                    key={m.label}
                    label={m.label}
                    items={m.items}
                    onNavigate={() => setOpen(false)}
                  />
                ) : (
                  <div key={m.label} className="border-b border-line">
                    <a
                      href={m.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-[44px] items-center text-[15px] font-semibold text-ink"
                    >
                      {m.label}
                    </a>
                  </div>
                ),
              )}
              <div className="mt-5 flex gap-2">
                {signedIn ? (
                  <Link
                    href="/app"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl bg-signal py-2.5 text-center text-sm font-bold text-white"
                  >
                    Go to dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-xl border border-line py-2.5 text-center text-sm font-semibold text-ink"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-xl bg-signal py-2.5 text-center text-sm font-bold text-white"
                    >
                      Get started free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Dropdown({
  label,
  cols,
  items,
  cta,
  isOpen,
  onOpen,
  onClose,
  onToggle,
}: {
  label: string;
  cols: 1 | 2;
  items: MenuItem[];
  cta?: { label: string; href: string };
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
}) {
  // Small grace period on mouse-leave so the panel doesn't snap shut when the
  // pointer briefly drifts off the trigger/panel.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(onClose, 140);
  }, [clearCloseTimer, onClose]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        onOpen();
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={cn(
          "inline-flex items-center gap-1 px-3 py-2 text-[14px] font-medium transition-colors",
          isOpen ? "text-ink" : "text-ink-muted hover:text-ink",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            // Drop straight down from this trigger (each Dropdown is its own
            // `relative` container). The `pt-2.5` both gives the card a few px
            // of breathing room under the header and acts as an invisible hover
            // "bridge" so the panel doesn't close while crossing the gap.
            className="absolute left-0 top-full z-50 pt-2.5"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <div
              role="menu"
              aria-label={label}
              // `max-w` clamps the card to the viewport so a left-aligned panel
              // can never push horizontal overflow, even for the right-most menu.
              className={cn(
                "max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-popover shadow-float",
                cols === 2 ? "w-[500px]" : "w-[300px]",
              )}
            >
              <div
                className={cn(
                  "grid gap-1 p-2.5",
                  cols === 2 ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                {items.map((it) => (
                  <a
                    key={it.label}
                    href={it.href}
                    role="menuitem"
                    onClick={onClose}
                    className="group/item flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl transition-transform group-hover/item:scale-105",
                        TINT[it.tint],
                      )}
                    >
                      <it.icon className="size-5" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold text-ink">
                        {it.label}
                      </span>
                      <span className="block text-[12px] leading-snug text-ink-soft">
                        {it.desc}
                      </span>
                    </span>
                  </a>
                ))}
              </div>

              {cta && (
                <a
                  href={cta.href}
                  role="menuitem"
                  onClick={onClose}
                  className="group/cta flex items-center justify-between gap-2 border-t border-line bg-secondary/50 px-5 py-3 text-[12.5px] font-semibold text-ink-muted transition-colors hover:bg-secondary hover:text-ink focus-visible:bg-secondary focus-visible:text-ink focus-visible:outline-none"
                >
                  {cta.label}
                  <ArrowRight className="size-3.5 transition-transform group-hover/cta:translate-x-0.5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileAccordion({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: MenuItem[];
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `mobile-acc-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex min-h-[44px] w-full items-center justify-between text-[15px] font-semibold text-ink"
      >
        {label}
        <ChevronDown
          className={cn(
            "size-4 text-ink-soft transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pb-2">
              {items.map((it) => (
                <a
                  key={it.label}
                  href={it.href}
                  onClick={onNavigate}
                  className="flex min-h-[40px] items-center gap-3 rounded-lg px-2 py-1.5 text-[14px] font-medium text-ink transition-colors hover:bg-secondary"
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg",
                      TINT[it.tint],
                    )}
                  >
                    <it.icon className="size-4" strokeWidth={1.9} />
                  </span>
                  {it.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
