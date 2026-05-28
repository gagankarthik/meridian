"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDot,
  FolderKanban,
  ListChecks,
  ShieldCheck,
  UserX,
} from "lucide-react";
import {
  COLUMN_LABEL,
  memberById,
  projectById,
  projectRole,
  type ProjectRole,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { Avatar, ProjectAvatar, StatCard, StatusChip } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<ProjectRole, string> = {
  Owner:
    "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  Admin: "border-signal/30 bg-signal-soft text-signal",
  Member: "border-line bg-secondary text-ink-muted",
  Viewer: "border-[#1d9aaa]/30 bg-[#1d9aaa]/10 text-[#1d9aaa]",
};

export function MemberDetail({ id }: { id: string }) {
  const router = useRouter();
  const ws = useWorkspace();
  // Resolve against the live workspace members so edits (here or elsewhere)
  // stay reflected. `memberById` resolves by record id OR linked Cognito sub.
  const member =
    ws.members.find((m) => m.id === id || m.userId === id) ?? memberById(id);

  // Project access is derived live from the member's record — granting/revoking
  // persists through `ws.updateMember`, so it propagates everywhere + survives
  // reload (no divergent local copy).
  const access = useMemo(
    () => new Set(member?.projects ?? []),
    [member?.projects],
  );
  const [toast, setToast] = useState<string | null>(null);

  // Tasks assigned to this member (from the live workspace store). Match on the
  // resolved member record id — the route `id` may be a Cognito sub while tasks
  // store the member's record id, so filtering on the raw param would miss
  // their tasks (and skew the Open/Completed/per-project counts derived below).
  const assigneeId = member?.id ?? id;
  const assigned = useMemo(
    () => ws.tasks.filter((t) => t.assigneeIds.includes(assigneeId)),
    [ws.tasks, assigneeId],
  );
  const openCount = useMemo(
    () => assigned.filter((t) => t.column !== "done").length,
    [assigned],
  );
  const doneCount = assigned.length - openCount;

  if (!member) {
    return (
      <div className="grid h-full place-items-center bg-paper p-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-card p-8 text-center shadow-card">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-ink-soft">
            <UserX className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-[20px] font-extrabold tracking-tight text-ink">
            Member not found
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
            This person may have been removed from the workspace or the link is
            no longer valid.
          </p>
          <Link
            href="/app/team"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-signal-strong"
          >
            <ArrowLeft className="size-3.5" />
            Back to team
          </Link>
        </div>
      </div>
    );
  }

  const canManage = ws.can("manage");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleAccess(pid: string) {
    if (!member) return;
    const project = projectById(pid);
    const next = new Set(access);
    if (next.has(pid)) {
      next.delete(pid);
      flash(`Revoked access to ${project?.name ?? "project"}`);
    } else {
      next.add(pid);
      flash(`Granted access to ${project?.name ?? "project"}`);
    }
    // Persist + propagate: updates the shared member record so the change
    // sticks on reload and shows in the team list / other views immediately.
    ws.updateMember(member.id, { projects: Array.from(next) });
  }

  // Projects this member belongs to, driven by local access state.
  // Projects the member belongs to — by their personal access list OR by being
  // on a project's team (owner/admin/member/viewer), so ownership and role
  // grants both surface here even if the access list hasn't caught up.
  const memberId = member?.id ?? id;
  const memberProjects = ws.projects.filter(
    (p) => access.has(p.id) || projectRole(p.id, memberId) !== null,
  );

  const taskCountInProject = (pid: string) =>
    assigned.filter((t) => t.projectId === pid).length;

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* header */}
      <header className="flex flex-col gap-5 rounded-2xl border border-line bg-card p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
        <Avatar
          initials={member.initials}
          hue={member.hue}
          size={72}
          className="shadow-raised"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {member.name}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md border border-signal/30 bg-signal-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-signal">
              <ShieldCheck className="size-3" />
              {member.role}
            </span>
            <StatusChip status={member.status} />
          </div>
          <a
            href={`mailto:${member.email}`}
            className="mt-1.5 inline-block text-[13.5px] text-ink-muted transition-colors hover:text-signal"
          >
            {member.email}
          </a>
        </div>
      </header>

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Projects"
          value={String(memberProjects.length)}
          delta="access"
          positive
          icon={FolderKanban}
        />
        <StatCard
          label="Tasks assigned"
          value={String(assigned.length)}
          delta="total"
          positive
          icon={ListChecks}
        />
        <StatCard
          label="Open"
          value={String(openCount)}
          delta="in progress"
          positive={openCount === 0}
          icon={CircleDot}
        />
        <StatCard
          label="Completed"
          value={String(doneCount)}
          delta="shipped"
          positive
          icon={CheckCircle2}
        />
      </div>

      {/* projects */}
      <section className="rounded-2xl border border-line bg-card shadow-card">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">
            Projects
          </h2>
          <span className="tnum text-[12px] text-ink-soft">
            {memberProjects.length}
          </span>
        </header>
        {memberProjects.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-ink-soft">
            {member.name.split(" ")[0]} isn&apos;t on any projects yet.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {memberProjects.map((p) => {
              const role = projectRole(p.id, member.id) ?? "Member";
              const count = taskCountInProject(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-paper-raised"
                >
                  <ProjectAvatar seed={p.name} size={36} rounded="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">
                      {p.name}
                    </p>
                    <p className="truncate text-[11px] font-medium tracking-wide text-ink-soft">
                      {p.key}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      ROLE_BADGE[role],
                    )}
                  >
                    {role}
                  </span>
                  <span className="tnum w-20 shrink-0 text-right text-[12px] text-ink-muted">
                    {count} {count === 1 ? "task" : "tasks"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* project access management (admins only) */}
      {canManage && (
        <section className="rounded-2xl border border-line bg-card shadow-card">
          <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Project access
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-signal/30 bg-signal-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-signal uppercase">
              <ShieldCheck className="size-3" />
              Admin
            </span>
          </header>
          <div className="space-y-3 p-5">
            <p className="text-[13px] leading-relaxed text-ink-muted">
              As an admin you can grant access to the projects you own.
            </p>
            <div className="space-y-1.5 rounded-xl border border-line bg-paper-raised p-1.5">
              {ws.projects.map((p) => {
                const on = access.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleAccess(p.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-card"
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
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
                      {on ? "Granted" : "No access"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* assigned tasks */}
      <section className="rounded-2xl border border-line bg-card shadow-card">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">
            Assigned tasks
          </h2>
          <span className="tnum text-[12px] text-ink-soft">
            {assigned.length}
          </span>
        </header>
        {assigned.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-ink-soft">
            No tasks assigned to {member.name.split(" ")[0]}.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {assigned.map((t) => {
              const project = projectById(t.projectId);
              const done = t.column === "done";
              return (
                <button
                  key={t.id}
                  onClick={() => ws.openTask(t.id)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-paper-raised"
                >
                  {project && (
                    <span
                      title={project.name}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-paper-raised px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink-muted"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: project.color }}
                      />
                      {project.key}
                    </span>
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[14px] font-medium text-ink",
                      done && "text-ink-soft line-through",
                    )}
                  >
                    {t.title}
                  </span>
                  <span
                    className={cn(
                      "hidden shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase sm:inline-flex",
                      done
                        ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "border-line bg-secondary text-ink-muted",
                    )}
                  >
                    {COLUMN_LABEL[t.column] ?? t.column}
                  </span>
                  <span className="tnum hidden w-28 shrink-0 items-center justify-end gap-1 text-right text-[12px] text-ink-soft sm:flex">
                    <CalendarDays className="size-3.5" />
                    {t.due}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* toast */}
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
