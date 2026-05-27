"use client";

import type { KeyboardEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Crown,
  Mail,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  memberById,
  projectById,
  projectMemberIds,
  projectRole,
  type Member,
  type ProjectRole,
} from "@/lib/app-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Avatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { authedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<ProjectRole, string> = {
  Lead: "border-signal/30 bg-signal-soft text-signal",
  Reviewer: "border-[#1d9aaa]/30 bg-[#1d9aaa]/10 text-[#1d9aaa]",
  Member: "border-line bg-secondary text-ink-muted",
};

const PROJECT_ROLES: ProjectRole[] = ["Member", "Reviewer", "Lead"];
const HUES = ["#2563eb", "#2f6df0", "#22a06b", "#1d9aaa", "#d9842b", "#7a3ff0"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Project-scoped invite that augments the derived member list locally. */
type Invite = { projectId: string; member: Member; role: ProjectRole };

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function ProjectTeamClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | ProjectRole>("all");
  const [reassignFor, setReassignFor] = useState<Member | null>(null);
  const [removeFor, setRemoveFor] = useState<Member | null>(null);

  // Only admins (or those who can manage) change roles / remove members.
  const canManage = ws.can("manage");

  // Project-scoped invites (local; augments the derived member list).
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<ProjectRole>("Member");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const project =
    ws.projects.find((p) => p.id === projectId) ?? projectById(projectId);

  const rows = useMemo(() => {
    return projectMemberIds(projectId)
      .map((id) => memberById(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => ({
        member: m,
        role: projectRole(projectId, m.id),
        tasks: ws.tasks.filter(
          (t) => t.projectId === projectId && t.assigneeIds.includes(m.id),
        ).length,
      }));
  }, [projectId, ws.tasks]);

  const allRows = useMemo(
    () => [
      ...rows,
      ...invites
        .filter((iv) => iv.projectId === projectId)
        .map((iv) => ({ member: iv.member, role: iv.role, tasks: 0 })),
    ],
    [rows, invites, projectId],
  );

  const leads = allRows.filter((r) => r.role === "Lead").length;
  const reviewers = allRows.filter((r) => r.role === "Reviewer").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (!q) return true;
      return (
        r.member.name.toLowerCase().includes(q) ||
        r.member.email.toLowerCase().includes(q)
      );
    });
  }, [allRows, search, roleFilter]);

  /* ---- member actions (admin-gated where destructive) ---- */
  function setMemberRole(memberId: string, role: ProjectRole) {
    if (!project) return;
    const leadIds = project.leadIds.filter((x) => x !== memberId);
    const reviewerIds = project.reviewerIds.filter((x) => x !== memberId);
    const memberIds = Array.from(new Set([...project.memberIds, memberId]));
    if (role === "Lead") leadIds.push(memberId);
    if (role === "Reviewer") reviewerIds.push(memberId);
    ws.updateProject(project.id, { leadIds, reviewerIds, memberIds });
    // Keep any local invite row in sync so the badge updates immediately.
    setInvites((list) =>
      list.map((iv) =>
        iv.member.id === memberId ? { ...iv, role } : iv,
      ),
    );
    setMenuId(null);
  }

  function removeFromProject(memberId: string) {
    if (project) {
      ws.updateProject(project.id, {
        leadIds: project.leadIds.filter((x) => x !== memberId),
        reviewerIds: project.reviewerIds.filter((x) => x !== memberId),
        memberIds: project.memberIds.filter((x) => x !== memberId),
      });
    }
    setInvites((list) => list.filter((iv) => iv.member.id !== memberId));
    setRemoveFor(null);
  }

  function reassignTasks(fromId: string, toId: string) {
    ws.tasks
      .filter((t) => t.projectId === projectId && t.assigneeIds.includes(fromId))
      .forEach((t) => {
        const next = Array.from(
          new Set(t.assigneeIds.map((x) => (x === fromId ? toId : x))),
        );
        ws.updateTask(t.id, { assigneeIds: next, assigneeId: next[0] ?? toId });
      });
    flash(
      `Reassigned tasks from ${memberById(fromId)?.name ?? "member"} to ${memberById(toId)?.name ?? "member"}`,
    );
    setReassignFor(null);
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  function resetInvite() {
    setEmails([]);
    setEmailDraft("");
    setEmailError(null);
    setInviteRole("Member");
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

    // Provision the invites in Cognito (no-op in demo mode), best-effort.
    void authedFetch("/api/team/invite", {
      method: "POST",
      body: JSON.stringify({
        emails: pending,
        groups: [`${projectId}#${inviteRole}`],
      }),
    }).catch(() => {});

    const created: Invite[] = pending.map((email, i) => ({
      projectId,
      role: inviteRole,
      member: {
        id: `u${Date.now()}${i}`,
        name: nameFromEmail(email),
        email,
        role: "Member",
        initials: email.slice(0, 2).toUpperCase(),
        status: "invited",
        hue: HUES[(rows.length + invites.length + i) % HUES.length],
        projects: [projectId],
      },
    }));

    setInvites((list) => [...list, ...created]);
    flash(
      `Invited ${pending.length} ${pending.length === 1 ? "person" : "people"} to ${project?.name ?? "this project"} as ${inviteRole}`,
    );
    resetInvite();
    setInviteOpen(false);
  }

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            {project?.name ?? "Project"}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            Team
          </h1>
        </div>
        {canManage && (
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
          >
            <UserPlus className="size-4" />
            Invite member
          </button>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          icon={Users}
          label="Members"
          value={allRows.length}
          tint="text-signal"
        />
        <StatTile
          icon={Crown}
          label="Leads"
          value={leads}
          tint="text-[#e2a200]"
        />
        <StatTile
          icon={ShieldCheck}
          label="Reviewers"
          value={reviewers}
          tint="text-[#1d9aaa]"
        />
      </div>

      {/* search + role filter */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 shadow-card focus-within:border-signal/40">
          <Search className="size-4 shrink-0 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name or email…"
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-soft"
          />
          {(search || roleFilter !== "all") && (
            <span className="tnum shrink-0 text-[12px] text-ink-soft">
              {filtered.length} of {allRows.length}
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl border border-line bg-card p-1 shadow-card">
          {(["all", "Lead", "Reviewer", "Member"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold capitalize transition-colors",
                roleFilter === r
                  ? "bg-signal text-white"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="overflow-visible rounded-2xl border border-line bg-card shadow-card">
        <div className="hidden grid-cols-[1fr_140px_140px_90px_44px] gap-4 border-b border-line bg-paper-raised px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft sm:grid">
          <span>Member</span>
          <span>Project role</span>
          <span>Workspace role</span>
          <span className="text-right">Tasks</span>
          <span />
        </div>
        <div className="divide-y divide-line">
          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-soft">
              No members match &apos;{search}&apos;.
            </p>
          ) : (
            filtered.map(({ member: m, role, tasks }) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper-raised sm:grid-cols-[1fr_140px_140px_90px_44px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar initials={m.initials} hue={m.hue} seed={m.initials} src={m.avatar} size={34} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                      <span className="truncate">{m.name}</span>
                      {m.status === "invited" && (
                        <span className="shrink-0 rounded-md border border-[#d9842b]/30 bg-[#d9842b]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#d9842b]">
                          Invited
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-ink-soft">
                      {m.email}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide",
                      ROLE_BADGE[role],
                    )}
                  >
                    {role}
                  </span>
                </div>

                <span className="hidden text-[13px] text-ink-muted sm:block">
                  {m.role}
                </span>

                <span className="tnum hidden text-right text-[13px] font-semibold text-ink sm:block">
                  {tasks}
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
                        <MenuItem
                          label="View profile"
                          onClick={() => {
                            setMenuId(null);
                            router.push(`/app/team/${m.id}`);
                          }}
                        />
                        {ws.can("assign") && (
                          <MenuItem
                            label="Reassign tasks"
                            onClick={() => {
                              setMenuId(null);
                              setReassignFor(m);
                            }}
                          />
                        )}
                        {canManage && (
                          <>
                            <div className="my-1.5 border-t border-line" />
                            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                              Set project role
                            </p>
                            {PROJECT_ROLES.filter((r) => r !== role).map((r) => (
                              <MenuItem
                                key={r}
                                label={`Make ${r}`}
                                onClick={() => setMemberRole(m.id, r)}
                              />
                            ))}
                            <div className="my-1.5 border-t border-line" />
                            <MenuItem
                              label="Remove from project"
                              danger
                              onClick={() => {
                                setMenuId(null);
                                setRemoveFor(m);
                              }}
                            />
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* invite to this project */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(next) => {
          setInviteOpen(next);
          if (!next) resetInvite();
        }}
      >
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 rounded-2xl p-0 sm:max-w-lg">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="font-display text-lg font-bold tracking-tight">
              Invite to {project?.name ?? "project"}
            </DialogTitle>
            <DialogDescription>
              Enter one or more emails and choose the role they&apos;ll have on
              this project. They&apos;ll appear here as pending invites.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* email chips */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-ink-soft">
                <span>Email addresses</span>
                {emails.length > 0 && (
                  <span className="tnum font-normal">{emails.length} added</span>
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
                  placeholder={emails.length ? "Add another…" : "name@company.com"}
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

            {/* project role */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
                Project role
              </label>
              <div className="flex gap-1 rounded-xl border border-line bg-paper-raised p-1">
                {PROJECT_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition-colors",
                      inviteRole === r
                        ? "bg-signal text-white"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11.5px] text-ink-soft">
                {inviteRole === "Lead"
                  ? "Leads own delivery and can manage the project."
                  : inviteRole === "Reviewer"
                    ? "Reviewers approve work and sign off on changes."
                    : "Members collaborate on tasks within the project."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 rounded-b-2xl border-t border-line bg-paper-raised px-5 py-4">
            <p className="text-[12px] text-ink-soft">
              {emails.length === 0 && !emailDraft.trim()
                ? "Add emails to continue"
                : `Inviting as ${inviteRole}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setInviteOpen(false);
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
                Send invite
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* reassign tasks dialog */}
      <Dialog
        open={!!reassignFor}
        onOpenChange={(o) => !o && setReassignFor(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold tracking-tight">
              Reassign tasks
            </DialogTitle>
            <DialogDescription>
              Move {reassignFor?.name}&apos;s tasks in {project?.name ?? "this project"} to
              another member.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-0.5 overflow-y-auto py-1">
            {allRows
              .filter((r) => r.member.id !== reassignFor?.id)
              .map(({ member: m }) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    reassignFor && reassignTasks(reassignFor.id, m.id)
                  }
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <Avatar initials={m.initials} hue={m.hue} seed={m.initials} src={m.avatar} size={26} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                    {m.name}
                  </span>
                  <span className="text-[11px] text-ink-soft">{m.email}</span>
                </button>
              ))}
            {allRows.filter((r) => r.member.id !== reassignFor?.id).length === 0 && (
              <p className="px-2.5 py-6 text-center text-[13px] text-ink-soft">
                No other members to reassign to.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* remove from project confirm */}
      <ConfirmDialog
        open={!!removeFor}
        title="Remove from project?"
        description={`${removeFor?.name ?? "This member"} will lose access to ${project?.name ?? "this project"}. Their tasks stay, but you may want to reassign them first.`}
        confirmLabel="Remove"
        danger
        onConfirm={() => removeFor && removeFromProject(removeFor.id)}
        onClose={() => setRemoveFor(null)}
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
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-soft">{label}</span>
        <Icon className={cn("size-4", tint)} strokeWidth={1.6} />
      </div>
      <p className="tnum mt-3 font-display text-[2rem] leading-none font-extrabold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}

function MenuItem({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center px-3 py-2 text-left text-[13px] font-medium transition-colors",
        danger
          ? "text-red-600 hover:bg-red-500/10"
          : "text-ink-muted hover:bg-secondary hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
