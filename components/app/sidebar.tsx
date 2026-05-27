"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronRight,
  LayoutGrid,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { MeridianMark } from "@/components/brand/logo";
import { CURRENT_PROJECT_ID } from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { CreateProjectDialog } from "@/components/app/create-project";
import { cn } from "@/lib/utils";

const MENU = [
  { label: "Dashboard", href: "/app", icon: LayoutGrid },
  { label: "Roadmap", href: "/app/roadmap", icon: Map },
  { label: "Assigned to me", href: "/app/assigned", icon: UserCheck },
  { label: "Created by me", href: "/app/created", icon: PenLine },
  { label: "Reports", href: "/app/reports", icon: BarChart3 },
  { label: "Team", href: "/app/team", icon: Users },
];

const VIEW_PATHS = [
  "/app/summary",
  "/app/board",
  "/app/table",
  "/app/timeline",
  "/app/approvals",
  "/app/attachments",
  "/app/project-team",
  "/app/project-settings",
];

export function AppSidebar({
  collapsed,
  mobile = false,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const ws = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(true);
  const activeProject = params.get("project") ?? CURRENT_PROJECT_ID;
  const onProjectView = VIEW_PATHS.some((p) => pathname.startsWith(p));

  return (
    <aside
      className={cn(
        "shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        mobile
          ? "flex h-full w-full"
          : "hidden transition-[width] duration-300 md:flex",
        !mobile && (collapsed ? "w-[68px]" : "w-64"),
      )}
    >
      {/* brand */}
      <div
        className={cn(
          "flex h-14 items-center gap-2.5",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <MeridianMark className="size-[22px] shrink-0 text-ink" />
        {!collapsed && (
          <span className="font-display text-[16px] font-extrabold tracking-tight text-ink">
            Meridian
          </span>
        )}
      </div>

      {/* menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {!collapsed && <GroupLabel>Menu</GroupLabel>}
        <div className="space-y-0.5">
          {MENU.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Row
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>

        <div
          className={cn(
            "mt-5 flex items-center justify-between pb-2",
            collapsed ? "px-0" : "px-3",
          )}
        >
          {!collapsed && (
            <button
              onClick={() => setShowProjects((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft transition-colors hover:text-ink"
            >
              <ChevronRight
                className={cn(
                  "size-3 transition-transform",
                  showProjects && "rotate-90",
                )}
              />
              Projects
            </button>
          )}
          {ws.can("create") && (
            <button
              onClick={() => setCreateOpen(true)}
              title="New project"
              className={cn(
                "grid size-5 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink",
                collapsed && "mx-auto",
              )}
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
        {(collapsed || showProjects) && (
        <div className="space-y-0.5">
          {ws.projects.map((p) => {
            const active = onProjectView && p.id === activeProject;
            return (
              <Link
                key={p.id}
                href={`/app/summary?project=${p.id}`}
                title={p.name}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "px-3",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-secondary hover:text-ink",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: p.color }}
                />
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span
                      className="tnum text-[11px] font-medium text-ink-soft"
                      title="Open tasks"
                    >
                      {
                        ws.tasks.filter(
                          (t) => t.projectId === p.id && t.column !== "done",
                        ).length
                      }
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
        )}
      </nav>
      {!mobile && onToggleCollapse && (
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-secondary hover:text-ink",
              collapsed ? "justify-center px-0" : "px-3",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" />
                Collapse
              </>
            )}
          </button>
        </div>
      )}
      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </aside>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-2">
      <span className="text-[11px] font-bold tracking-wide uppercase text-ink-soft">
        {children}
      </span>
    </div>
  );
}

function Row({
  href,
  label,
  icon: Icon,
  active,
  badge,
  collapsed,
  onNavigate,
}: {
  href?: string;
  label: string;
  icon: typeof LayoutGrid;
  active?: boolean;
  badge?: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-signal" />
      )}
      <Icon className="size-4 shrink-0" strokeWidth={1.9} />
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
      {!collapsed && badge && (
        <span className="tnum grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </>
  );

  const className = cn(
    "group relative flex items-center gap-3 rounded-lg py-2 text-[13.5px] font-semibold transition-colors",
    collapsed ? "justify-center px-0" : "px-3",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-secondary hover:text-ink",
  );

  if (href) {
    return (
      <Link href={href} title={label} onClick={onNavigate} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button title={label} className={cn(className, "w-full")}>
      {content}
    </button>
  );
}

