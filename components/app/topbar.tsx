"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import {
  Bell,
  ChevronDown,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { Avatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cognitoConfigured } from "@/lib/cognito";
import { cn } from "@/lib/utils";

export function AppTopbar({
  onOpenMobileNav,
}: {
  onOpenMobileNav: () => void;
}) {
  const { workspace } = useWorkspace();
  return (
    <header className="relative z-40 flex h-14 items-center gap-4 border-b border-line bg-paper/90 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="grid size-9 place-items-center rounded-xl border border-line bg-card text-ink-muted transition-colors hover:text-ink md:hidden"
      >
        <Menu className="size-4" />
      </button>

      {/* org logo + name (left end) */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-line-strong bg-card text-[15px] font-bold text-ink shadow-card">
          {workspace.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspace.logo} alt="" className="size-full object-cover" />
          ) : (
            (workspace.name || "M").slice(0, 1).toUpperCase()
          )}
        </span>
        <span className="hidden max-w-[180px] truncate text-[15px] font-bold tracking-tight text-ink sm:inline">
          {workspace.name}
        </span>
      </div>

      {/* center: active search */}
      <div className="absolute left-1/2 hidden w-full max-w-md -translate-x-1/2 px-4 md:block">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Notifications />
        <ProfileMenu />
      </div>
    </header>
  );
}

/* ----------------------------- Search ----------------------------- */
function SearchBar() {
  const ws = useWorkspace();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const query = q.trim().toLowerCase();

  const taskResults = query
    ? ws.tasks.filter((t) => t.title.toLowerCase().includes(query)).slice(0, 6)
    : [];
  const projResults = query
    ? ws.projects.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 4)
    : [];
  const empty = query && taskResults.length === 0 && projResults.length === 0;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-ink-soft transition-colors focus-within:border-signal/40">
        <Search className="size-4" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search tasks, projects, people…"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-soft"
        />
        {q ? (
          <button onClick={() => setQ("")} className="text-ink-soft hover:text-ink">
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
            ⌘K
          </kbd>
        )}
      </div>

      {open && query && (
        <>
          <button
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] cursor-default"
          />
          <div className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-popover p-1.5 shadow-float">
            {empty && (
              <p className="px-3 py-6 text-center text-[13px] text-ink-soft">
                No matches for &ldquo;{q}&rdquo;
              </p>
            )}
            {projResults.length > 0 && (
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                Projects
              </p>
            )}
            {projResults.map((p) => (
              <Link
                key={p.id}
                href={`/app/summary?project=${p.id}`}
                onClick={() => {
                  setOpen(false);
                  setQ("");
                }}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary"
              >
                <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                <span className="text-[13.5px] font-medium text-ink">{p.name}</span>
                <span className="ml-auto font-mono text-[11px] text-ink-soft">{p.key}</span>
              </Link>
            ))}
            {taskResults.length > 0 && (
              <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                Tasks
              </p>
            )}
            {taskResults.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  ws.openTask(t.id);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
              >
                <span className="size-2 rounded-full" style={{ background: t.tagColor }} />
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{t.title}</span>
                <span className="font-mono text-[11px] text-ink-soft">{t.due}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------- Notifications -------------------------- */
function Notifications() {
  const [open, setOpen] = useState(false);
  const { notifications } = useWorkspace();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative grid size-9 place-items-center rounded-xl border border-line bg-card text-ink-muted transition-colors hover:text-ink"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="tnum absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-signal text-[9px] font-bold text-white ring-2 ring-paper">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] cursor-default"
          />
          <div className="absolute right-0 top-full z-[80] mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-line bg-popover shadow-float">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-[13px] font-bold text-ink">Notifications</span>
              <button className="text-[12px] font-semibold text-signal hover:underline">
                Mark all read
              </button>
            </div>
            <div className="max-h-96 divide-y divide-line overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-ink-soft">
                  You&apos;re all caught up.
                </p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-paper-raised",
                    n.unread && "bg-signal-soft/40",
                  )}
                >
                  <Avatar initials={n.initials} hue={n.hue} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug text-ink">
                      <span className="font-semibold">{n.who}</span> {n.text}
                    </p>
                    <span className="text-[11px] text-ink-soft">{n.time} ago</span>
                  </div>
                  {n.unread && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-signal" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ----------------------------- Profile ----------------------------- */
function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ws = useWorkspace();
  const record = ws.members.find((m) => m.id === ws.me.id);
  const me = {
    name: ws.me.name || record?.name || "You",
    email: ws.me.email || record?.email || "",
    initials:
      record?.initials ?? (ws.me.name || "You").slice(0, 2).toUpperCase(),
    hue: record?.hue ?? "#2563eb",
    avatar: record?.avatar,
  };

  async function handleSignOut() {
    setOpen(false);
    if (cognitoConfigured) {
      try {
        await signOut();
      } catch {
        /* fall through to navigation */
      }
    }
    router.push("/");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-line bg-card py-1 pl-1 pr-2.5 transition-colors hover:border-signal/40"
      >
        <Avatar initials={me.initials} hue={me.hue} seed={me.initials} src={me.avatar} size={28} />
        <span className="hidden text-[13px] font-semibold text-ink lg:inline">
          {me.name}
        </span>
        <ChevronDown className="size-3.5 text-ink-soft" />
      </button>

      {open && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] cursor-default"
          />
          <div className="absolute right-0 top-full z-[80] mt-2 w-60 overflow-hidden rounded-xl border border-line bg-popover shadow-float">
            <div className="flex items-center gap-3 border-b border-line p-3">
              <Avatar initials={me.initials} hue={me.hue} seed={me.initials} src={me.avatar} size={36} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-ink">{me.name}</p>
                <p className="truncate text-[11px] text-ink-soft">{me.email}</p>
              </div>
            </div>
            <div className="p-1.5">
              <MenuLink href="/app/profile" icon={User} label="Profile" onClick={() => setOpen(false)} />
              <MenuLink href="/app/settings" icon={Settings} label="Settings" onClick={() => setOpen(false)} />
              <MenuLink href="/app/settings" icon={LifeBuoy} label="Help" onClick={() => setOpen(false)} />
            </div>
            <div className="border-t border-line p-1.5">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-secondary hover:text-ink"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-secondary hover:text-ink"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
