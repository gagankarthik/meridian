"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Inbox,
  Search,
  X,
} from "lucide-react";
import { memberById, taskKey, type Task } from "@/lib/app-data";
import { AvatarStack, MemberAvatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

type FilterId = "pending" | "approved" | "rejected" | "all";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Changes requested" },
  { id: "all", label: "All" },
];

type ReviewStatus = "pending" | "approved" | "rejected";

const statusOf = (t: Task): ReviewStatus | null =>
  t.column === "review" ? "pending" : (t.reviewStatus ?? null);

export function ApprovalsClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const [filter, setFilter] = useState<FilterId>("pending");
  const [query, setQuery] = useState("");
  const [rejectFor, setRejectFor] = useState<Task | null>(null);
  const [reason, setReason] = useState("");

  // A review can be decided by the assigned reviewer (matched against both my
  // sub and member-record id) or by any owner/admin of the project.
  const myRecordId = ws.members.find(
    (m) => m.id === ws.me.id || m.userId === ws.me.id,
  )?.id;
  const myIds = useMemo(
    () => new Set([ws.me.id, myRecordId].filter(Boolean) as string[]),
    [ws.me.id, myRecordId],
  );
  const canReview = (t: Task) =>
    (t.reviewerId ? myIds.has(t.reviewerId) : false) ||
    ws.canInProject(projectId, "manage");

  const tasks = useMemo(
    () =>
      ws.tasks.filter(
        (t) => t.projectId === projectId && statusOf(t) !== null,
      ),
    [ws.tasks, projectId],
  );

  const counts = useMemo(() => {
    const c = { all: tasks.length, pending: 0, approved: 0, rejected: 0 };
    for (const t of tasks) {
      const s = statusOf(t);
      if (s) c[s] += 1;
    }
    return c;
  }, [tasks]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (filter === "all" || statusOf(t) === filter) &&
          (!q || t.title.toLowerCase().includes(q)),
      ),
    [tasks, filter, q],
  );

  const submitReject = () => {
    if (rejectFor) {
      ws.reviewTask(rejectFor.id, "rejected", reason.trim() || undefined);
    }
    setRejectFor(null);
    setReason("");
  };

  if (tasks.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-card py-16 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-secondary text-ink-soft">
            <Inbox className="size-5" />
          </span>
          <p className="text-[15px] font-bold text-ink">Nothing in review</p>
          <p className="max-w-sm text-[13px] text-ink-soft">
            When someone sends a task for review, it shows up here for the
            reviewer to approve or request changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks in review…"
            className="w-full rounded-xl border border-line bg-card py-1.5 pr-8 pl-8 text-[13px] text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid size-4 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-card p-1">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold transition-colors",
                  active
                    ? "bg-signal-soft text-signal-strong"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "tnum text-[11px] font-bold",
                    active ? "text-signal-strong" : "text-ink-soft",
                  )}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-card py-16 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-secondary text-ink-soft">
            <Search className="size-5" />
          </span>
          <p className="text-[15px] font-bold text-ink">No matching tasks</p>
          <p className="text-[13px] text-ink-soft">
            Try a different search or filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((t) => (
            <ReviewRow
              key={t.id}
              task={t}
              status={statusOf(t)!}
              canReview={canReview(t)}
              onOpen={() => ws.openTask(t.id)}
              onApprove={() => ws.reviewTask(t.id, "approved")}
              onReject={() => {
                setRejectFor(t);
                setReason("");
              }}
            />
          ))}
        </div>
      )}

      {/* request-changes reason dialog */}
      {rejectFor && (
        <div className="fixed inset-0 z-[120] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setRejectFor(null)}
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-[440px] rounded-2xl border border-line bg-card p-6 shadow-float">
            <div className="grid size-11 place-items-center rounded-xl bg-red-500/10 text-red-600">
              <AlertCircle className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-[18px] font-extrabold tracking-tight text-ink">
              Request changes
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              Send “{rejectFor.title}” back to the assignee. Add a reason so they
              know what to fix (optional).
            </p>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What needs to change? (optional)"
              className="mt-4 w-full resize-y rounded-xl border border-line bg-paper-raised px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40"
            />
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectFor(null)}
                className="rounded-xl border border-line bg-card px-4 py-2.5 text-[13px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReject}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-red-700"
              >
                Request changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_META: Record<
  ReviewStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    className: "border-[#d9842b]/30 bg-[#d9842b]/10 text-[#b8690f] dark:text-[#e2a200]",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className:
      "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Changes requested",
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    icon: AlertCircle,
  },
};

function ReviewRow({
  task,
  status,
  canReview,
  onOpen,
  onApprove,
  onReject,
}: {
  task: Task;
  status: ReviewStatus;
  canReview: boolean;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const reviewer = task.reviewerId ? memberById(task.reviewerId) : undefined;
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card transition-colors hover:border-line-strong">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-soft">
              {taskKey(task)}
            </span>
            <span className="truncate text-[14px] font-bold text-ink">
              {task.title}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            {task.due && task.due !== "—" ? `Due ${task.due}` : "No due date"}
          </p>
        </button>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide",
            meta.className,
          )}
        >
          <Icon className="size-3" />
          {meta.label}
        </span>

        {/* assignees + reviewer */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-soft">By</span>
            <AvatarStack ids={task.assigneeIds} size={24} max={3} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-soft">
              Reviewer
            </span>
            {reviewer ? (
              <MemberAvatar member={reviewer} size={24} />
            ) : (
              <span className="text-[12px] text-ink-soft">—</span>
            )}
          </div>
        </div>

        {status === "pending" && canReview && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-red-400 hover:text-red-600"
            >
              <X className="size-3.5" />
              Request changes
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <Check className="size-3.5" />
              Approve
            </button>
          </div>
        )}
      </div>

      {status === "rejected" && task.reviewNote && (
        <p className="mt-2.5 rounded-lg bg-paper-raised px-3 py-2 text-[12.5px] text-ink-muted">
          {task.reviewNote}
        </p>
      )}
    </div>
  );
}
