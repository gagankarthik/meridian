"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Avatar, StatusChip } from "@/components/app/widgets";
import {
  projectById,
  type Member,
  type Role,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { authedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const HUES = ["#2563eb", "#2f6df0", "#1f9d6b", "#1d9aaa", "#d9842b", "#1d9aaa"];
const ROLES: Role[] = ["Member", "Admin", "Viewer"];
const INVITE_ROLES: Role[] = ["Member", "Admin", "Viewer"];
const ROLE_RANK: Record<string, number> = { Admin: 3, Member: 2, Viewer: 1 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nameFromEmail(email: string) {
  const local = email.split("@")[0];
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function TeamClient() {
  const ws = useWorkspace();
  const [members, setMembers] = useState<Member[]>(ws.members);
  // Keep the table in sync with live workspace members as they load.
  useEffect(() => setMembers(ws.members), [ws.members]);
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Set<string>>(new Set());
  const [projectRoles, setProjectRoles] = useState<Record<string, Role>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [accessMember, setAccessMember] = useState<Member | null>(null);
  const [accessProjects, setAccessProjects] = useState<Set<string>>(new Set());
  const [removeMemberTarget, setRemoveMemberTarget] = useState<Member | null>(
    null,
  );

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  function resetInvite() {
    setEmails([]);
    setEmailDraft("");
    setEmailError(null);
    setProjects(new Set());
    setProjectRoles({});
  }

  function commitEmail(raw: string) {
    const candidate = raw.trim().replace(/[,;]+$/, "").trim();
    if (!candidate) return true;
    if (!EMAIL_RE.test(candidate)) {
      setEmailError(`'${candidate}' is not a valid email`);
      return false;
    }
    const lower = candidate.toLowerCase();
    if (emails.some((e) => e.toLowerCase() === lower)) {
      setEmailDraft("");
      setEmailError(`${candidate} is already added`);
      return true;
    }
    setEmails((list) => [...list, candidate]);
    setEmailDraft("");
    setEmailError(null);
    return true;
  }

  function handleEmailKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      if (emailDraft.trim()) {
        e.preventDefault();
        commitEmail(emailDraft);
      }
    } else if (e.key === "Backspace" && !emailDraft && emails.length) {
      setEmails((list) => list.slice(0, -1));
    }
  }

  function removeEmail(target: string) {
    setEmails((list) => list.filter((e) => e !== target));
  }

  function sendInvites() {
    // Fold any leftover text in the input into a chip first.
    const draft = emailDraft.trim();
    let pending = emails;
    if (draft) {
      if (!EMAIL_RE.test(draft)) {
        setEmailError(`'${draft}' is not a valid email`);
        return;
      }
      const lower = draft.toLowerCase();
      if (!emails.some((e) => e.toLowerCase() === lower)) {
        pending = [...emails, draft];
      }
    }
    if (pending.length === 0) {
      setEmailError("Add at least one email address");
      return;
    }

    const selected = Array.from(projects);
    const topRole: Role = selected.reduce<Role>((best, pid) => {
      const r = projectRoles[pid] ?? "Member";
      return ROLE_RANK[r] > ROLE_RANK[best] ? r : best;
    }, "Member");

    // Provision the invites in Cognito (no-op in demo mode); keep the UI
    // responsive by not blocking on the network.
    void authedFetch("/api/team/invite", {
      method: "POST",
      body: JSON.stringify({
        emails: pending,
        groups: selected.map((pid) => `${pid}#${projectRoles[pid] ?? "Member"}`),
      }),
    }).catch(() => {});

    const created: Member[] = pending.map((email, i) => {
      const local = email.split("@")[0];
      return {
        id: `u${Date.now()}${i}`,
        name: nameFromEmail(email),
        email,
        role: topRole,
        initials: local.slice(0, 2).toUpperCase(),
        status: "invited",
        hue: HUES[(members.length + i) % HUES.length],
        projects: selected,
      };
    });

    setMembers((m) => [...m, ...created]);
    flash(
      `Invited ${pending.length} ${pending.length === 1 ? "person" : "people"} to ${selected.length} project${selected.length === 1 ? "" : "s"}`,
    );
    resetInvite();
    setOpen(false);
  }

  function setMemberRole(id: string, r: Role) {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role: r } : m)));
    ws.updateMember(id, { role: r }); // persist
    setMenuId(null);
    flash(`Role updated to ${r}`);
  }
  function removeMember(m: Member) {
    setMembers((ms) => ms.filter((x) => x.id !== m.id));
    ws.removeMember(m.id); // persist the removal so it sticks on reload
    flash(`Removed ${m.name}`);
  }
  function openAccessDialog(m: Member) {
    setAccessMember(m);
    setAccessProjects(new Set(m.projects));
  }
  function toggleAccessProject(id: string) {
    setAccessProjects((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function saveAccess() {
    if (!accessMember) return;
    const next = Array.from(accessProjects);
    const target = accessMember;
    setMembers((ms) =>
      ms.map((x) => (x.id === target.id ? { ...x, projects: next } : x)),
    );
    ws.updateMember(target.id, { projects: next }); // persist
    flash(`Updated access for ${target.name}`);
    setAccessMember(null);
  }
  function toggleProject(id: string) {
    setProjects((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    setProjectRoles((r) => {
      if (r[id]) return r;
      return { ...r, [id]: "Member" };
    });
  }
  function setProjectRole(id: string, r: Role) {
    setProjectRoles((prev) => ({ ...prev, [id]: r }));
  }

  const total = members.length;
  const active = members.filter((m) => m.status === "active").length;
  const pending = members.filter((m) => m.status === "invited").length;
  const admins = members.filter(
    (m) => m.role === "Admin" || m.role === "Owner",
  ).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            {active} active · {pending} pending
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            Team
          </h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
        >
          <UserPlus className="size-4" />
          Invite people
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total members" value={total} />
        <StatTile label="Active" value={active} accent="#1f9d6b" />
        <StatTile label="Pending" value={pending} accent="#d9842b" />
        <StatTile label="Admins & owners" value={admins} accent="#2563eb" />
      </div>

      {/* search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 shadow-card focus-within:border-signal/40 sm:w-auto">
          <Search className="size-4 shrink-0 text-ink-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full min-w-0 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-soft sm:w-56"
          />
        </div>
        <p className="tnum text-[12px] text-ink-soft">
          {filtered.length} of {total} shown
        </p>
      </div>

      {/* table */}
      <div className="overflow-visible rounded-2xl border border-line bg-card shadow-card">
        <div className="hidden grid-cols-[1fr_120px_110px_110px_110px_44px] gap-4 border-b border-line bg-paper-raised px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft sm:grid">
          <span>Member</span>
          <span className="hidden lg:block">Projects</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last active</span>
          <span />
        </div>
        <div className="divide-y divide-line">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-ink-soft">
              No members match &apos;{query}&apos;.
            </p>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper-raised sm:grid-cols-[1fr_120px_110px_110px_110px_44px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar initials={m.initials} hue={m.hue} size={34} />
                  <div className="min-w-0">
                    <Link
                      href={`/app/team/${m.id}`}
                      className="block truncate text-[14px] font-semibold text-ink transition-colors hover:text-signal"
                    >
                      {m.name}
                    </Link>
                    <p className="truncate text-[11px] text-ink-soft">{m.email}</p>
                  </div>
                </div>

                <div className="hidden items-center gap-2 lg:flex">
                  {m.projects.length === 0 ? (
                    <span className="text-[12px] text-ink-soft">—</span>
                  ) : (
                    <>
                      <span className="flex -space-x-1">
                        {m.projects.slice(0, 4).map((pid) => {
                          const p = projectById(pid);
                          if (!p) return null;
                          return (
                            <span
                              key={pid}
                              title={p.name}
                              className="size-3.5 rounded-[4px] ring-2 ring-card"
                              style={{ background: p.color }}
                            />
                          );
                        })}
                      </span>
                      <span className="tnum text-[12px] font-medium text-ink-muted">
                        {m.projects.length}
                      </span>
                    </>
                  )}
                </div>

                <span className="hidden text-[13px] text-ink-muted sm:block">{m.role}</span>
                <div className="hidden sm:block">
                  <StatusChip status={m.status} />
                </div>
                <span className="hidden text-[12px] text-ink-soft sm:block">
                  {m.status === "invited" ? "—" : "today"}
                </span>

                <div className="relative justify-self-end">
                  <button
                    onClick={() => setMenuId((v) => (v === m.id ? null : m.id))}
                    className="grid size-8 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                  {menuId === m.id && (
                    <>
                      <button
                        aria-label="Close"
                        onClick={() => setMenuId(null)}
                        className="fixed inset-0 z-40 cursor-default"
                      />
                      <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-popover py-1.5 shadow-float">
                        {m.status === "invited" && (
                          <ActionItem
                            icon={RefreshCw}
                            label="Resend invite"
                            onClick={() => {
                              setMenuId(null);
                              flash(`Invite resent to ${m.email}`);
                            }}
                          />
                        )}
                        <ActionItem
                          icon={UserCog}
                          label="Manage project access"
                          onClick={() => {
                            setMenuId(null);
                            openAccessDialog(m);
                          }}
                        />
                        <div className="my-1.5 border-t border-line" />
                        <p className="px-3 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                          Change role
                        </p>
                        {ROLES.filter((r) => r !== m.role).map((r) => (
                          <ActionItem
                            key={r}
                            icon={ShieldCheck}
                            label={`Make ${r}`}
                            onClick={() => setMemberRole(m.id, r)}
                          />
                        ))}
                        <div className="my-1.5 border-t border-line" />
                        <ActionItem
                          icon={Trash2}
                          label="Remove from team"
                          danger
                          onClick={() => {
                            setMenuId(null);
                            setRemoveMemberTarget(m);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* invite dialog */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetInvite();
        }}
      >
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 rounded-2xl p-0 sm:max-w-lg">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="font-display text-lg font-bold tracking-tight">
              Invite teammates
            </DialogTitle>
            <DialogDescription>
              Add one or more people, then grant project access with a role per
              project. You can invite several people at once.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* email chips */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-ink-soft">
                <span>Email addresses</span>
                {emails.length > 0 && (
                  <span className="tnum font-normal">
                    {emails.length} added
                  </span>
                )}
              </label>
              <div
                className={cn(
                  "flex flex-wrap items-center gap-1.5 rounded-xl border bg-paper-raised px-2.5 py-2 transition-colors focus-within:border-signal/40",
                  emailError ? "border-red-500/50" : "border-line",
                )}
              >
                <Mail className="ml-0.5 size-4 shrink-0 text-ink-soft" />
                {emails.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1 rounded-lg bg-signal-soft py-1 pl-2.5 pr-1 text-[12.5px] font-medium text-signal-strong"
                  >
                    {e}
                    <button
                      type="button"
                      aria-label={`Remove ${e}`}
                      onClick={() => removeEmail(e)}
                      className="grid size-4 place-items-center rounded-md text-signal-strong/70 transition-colors hover:bg-signal/15 hover:text-signal-strong"
                    >
                      <X className="size-3" strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  autoFocus
                  value={emailDraft}
                  onChange={(e) => {
                    setEmailDraft(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  onKeyDown={handleEmailKeyDown}
                  onBlur={() => emailDraft.trim() && commitEmail(emailDraft)}
                  placeholder={
                    emails.length ? "Add another…" : "name@company.com"
                  }
                  className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-[14px] text-ink outline-none placeholder:text-ink-soft"
                />
              </div>
              <p
                className={cn(
                  "mt-1.5 text-[11.5px]",
                  emailError ? "text-red-600" : "text-ink-soft",
                )}
              >
                {emailError ?? "Press Enter or comma to add each address."}
              </p>
            </div>

            {/* per-project access + role */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-ink-soft">
                <span>Project access</span>
                <span className="tnum font-normal">
                  {projects.size} selected
                </span>
              </label>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-line bg-paper-raised p-1.5">
                {ws.projects.map((p) => {
                  const on = projects.has(p.id);
                  const pr = projectRoles[p.id] ?? "Member";
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "rounded-lg transition-colors",
                        on && "bg-card",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleProject(p.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-card"
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors",
                            on
                              ? "border-signal bg-signal text-white"
                              : "border-line",
                          )}
                        >
                          {on && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{ background: p.color }}
                        />
                        <span className="flex-1 truncate text-[13.5px] font-medium text-ink">
                          {p.name}
                        </span>
                        {!on && (
                          <span className="text-[11px] font-medium text-ink-soft">
                            No access
                          </span>
                        )}
                      </button>
                      {on && (
                        <div className="flex items-center gap-2 px-2.5 pb-2 pl-10">
                          <div className="flex flex-1 gap-1 rounded-lg border border-line bg-paper-raised p-0.5">
                            {INVITE_ROLES.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setProjectRole(p.id, r)}
                                className={cn(
                                  "flex-1 rounded-md py-1 text-[12px] font-semibold transition-colors",
                                  pr === r
                                    ? "bg-signal text-white"
                                    : "text-ink-muted hover:text-ink",
                                )}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {projects.size === 0 && (
                <p className="mt-1.5 text-[11.5px] text-ink-soft">
                  No projects selected yet — invitees will join with no project
                  access.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 rounded-b-2xl border-t border-line bg-paper-raised px-5 py-4">
            <p className="text-[12px] text-ink-soft">
              {emails.length === 0
                ? "Add emails to continue"
                : `Inviting ${emails.length} ${emails.length === 1 ? "person" : "people"}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  resetInvite();
                }}
                className="rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40"
              >
                Cancel
              </button>
              <button
                onClick={sendInvites}
                disabled={emails.length === 0 && !emailDraft.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UserPlus className="size-3.5" />
                Send invites
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* manage project access dialog */}
      <Dialog
        open={accessMember !== null}
        onOpenChange={(next) => {
          if (!next) setAccessMember(null);
        }}
      >
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 rounded-2xl p-0 sm:max-w-md">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="font-display text-lg font-bold tracking-tight">
              Manage project access
            </DialogTitle>
            <DialogDescription>
              {accessMember
                ? `Choose which projects ${accessMember.name} can access.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <label className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-ink-soft">
              <span>Project access</span>
              <span className="tnum font-normal">
                {accessProjects.size} selected
              </span>
            </label>
            <div className="space-y-1 rounded-xl border border-line bg-paper-raised p-1.5">
              {ws.projects.map((p) => {
                const on = accessProjects.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleAccessProject(p.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-card",
                      on && "bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors",
                        on
                          ? "border-signal bg-signal text-white"
                          : "border-line",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ background: p.color }}
                    />
                    <span className="flex-1 truncate text-[13.5px] font-medium text-ink">
                      {p.name}
                    </span>
                    {!on && (
                      <span className="text-[11px] font-medium text-ink-soft">
                        No access
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 rounded-b-2xl border-t border-line bg-paper-raised px-5 py-4">
            <button
              onClick={() => setAccessMember(null)}
              className="rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40"
            >
              Cancel
            </button>
            <button
              onClick={saveAccess}
              className="rounded-xl bg-signal px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* remove from team confirmation */}
      <ConfirmDialog
        open={removeMemberTarget !== null}
        title="Remove from team?"
        description={
          removeMemberTarget
            ? `${removeMemberTarget.name} will lose access to all projects in this workspace. This action removes them immediately.`
            : ""
        }
        confirmLabel="Remove"
        danger
        onConfirm={() => {
          if (removeMemberTarget) removeMember(removeMemberTarget);
        }}
        onClose={() => setRemoveMemberTarget(null)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[13px] font-medium text-white shadow-float">
          <span className="grid size-5 place-items-center rounded-full bg-signal text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-soft">{label}</span>
        <Users className="size-4 text-ink-soft" strokeWidth={1.6} />
      </div>
      <p
        className={cn(
          "tnum mt-3 font-display text-[1.75rem] leading-none font-extrabold tracking-tight",
          !accent && "text-ink",
        )}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof ShieldCheck;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors",
        danger
          ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
          : "text-ink-muted hover:bg-secondary hover:text-ink",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
