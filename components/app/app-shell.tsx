"use client";

import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppSidebar } from "./sidebar";
import { AppTopbar } from "./topbar";
import { WorkspaceProvider, useWorkspace } from "./workspace";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  // Esc to close the mobile drawer + lock body scroll while it's open.
  // Listener-only effect; no synchronous setState in the effect body.
  useEffect(() => {
    if (!mobileNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNav(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNav]);

  return (
    <WorkspaceProvider>
      <div className="flex h-screen overflow-hidden bg-paper">
        <Suspense
          fallback={
            <aside
              className={`hidden shrink-0 border-r border-sidebar-border bg-sidebar md:block ${collapsed ? "w-[68px]" : "w-64"}`}
            />
          }
        >
          <AppSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar onOpenMobileNav={() => setMobileNav(true)} />
          <MainArea>{children}</MainArea>
        </div>
      </div>

      {/* Mobile slide-in nav drawer */}
      <AnimatePresence>
        {mobileNav && (
          <div className="fixed inset-0 z-[90] block md:hidden">
            <motion.button
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
              className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[3px]"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="absolute inset-y-0 left-0 flex h-full w-[18rem] max-w-[85vw] flex-col bg-sidebar shadow-float"
            >
              <Suspense
                fallback={
                  <aside className="flex h-full w-full shrink-0 border-r border-sidebar-border bg-sidebar" />
                }
              >
                <AppSidebar
                  collapsed={false}
                  mobile
                  onNavigate={() => setMobileNav(false)}
                />
              </Suspense>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </WorkspaceProvider>
  );
}

/* Renders the workspace skeleton while live data bootstraps; in demo mode
   loading is already false, so children render immediately. */
function MainArea({ children }: { children: React.ReactNode }) {
  const ws = useWorkspace();
  return (
    <main className="flex-1 overflow-y-auto bg-sunken">
      {ws.loading ? <WorkspaceSkeleton /> : children}
    </main>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-line" />
          <div className="h-8 w-64 animate-pulse rounded-lg bg-line" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-xl bg-line" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-line bg-card"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl border border-line bg-card lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl border border-line bg-card" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-line bg-card" />
    </div>
  );
}
