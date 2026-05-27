"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clock,
  Inbox,
  LayoutGrid,
  RotateCcw,
  Search,
  Table2,
  X,
} from "lucide-react";
import { memberById, type Approval, type ApprovalStatus } from "@/lib/app-data";
import { Avatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ApprovalStatus;
type ViewMode = "table" | "grid";

const STATUS_META: Record<
  ApprovalStatus,
  { label: string; chip: string; pill: string; icon: typeof Check }
> = {
  pending: {
    label: "Pending",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    chip: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
    pill: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
    icon: Check,
  },
  rejected: {
    label: "Rejected",
    chip: "border-red-600/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300",
    pill: "border-red-600/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300",
    icon: X,
  },
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const M = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        M.chip,
      )}
    >
      <M.icon className="size-3" />
      {M.label}
    </span>
  );
}

function Person({ id }: { id: string }) {
  const m = memberById(id);
  if (!m) return <span className="text-ink-soft">—</span>;
  return (
    <span className="flex items-center gap-2">
      <Avatar initials={m.initials} hue={m.hue} seed={m.initials} src={m.avatar} size={24} />
      <span className="truncate text-[13px] text-ink">{m.name}</span>
    </span>
  );
}

export function ApprovalsClient({ projectId }: { projectId: string }) {
  const { approvals, setApprovalStatus, can } = useWorkspace();
  const items = useMemo(
    () => approvals.filter((a) => a.projectId === projectId),
    [approvals, projectId],
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("table");

  // Approving/rejecting is a review action and persists through the provider.
  const canReview = can("edit");
  const set = (id: string, status: ApprovalStatus) =>
    setApprovalStatus(id, status);

  const statusOf = (a: Approval): ApprovalStatus => a.status;

  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, approved: 0, rejected: 0 };
    for (const a of items) c[statusOf(a)] += 1;
    return c;
  }, [items]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      items.filter(
        (a) =>
          (filter === "all" || statusOf(a) === filter) &&
          (!q || a.title.toLowerCase().includes(q)),
      ),
    [items, filter, q],
  );

  if (items.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-card py-16 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-secondary text-ink-soft">
            <Inbox className="size-5" />
          </span>
          <p className="text-[15px] font-bold text-ink">No approvals yet</p>
          <p className="text-[13px] text-ink-soft">
            Approval requests for this project will appear here.
          </p>
        </div>
      </div>
    );
  }

  const actions = (a: Approval) => {
    if (!canReview) return null;
    const status = statusOf(a);
    if (status === "pending") {
      return (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => set(a.id, "rejected")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-red-400 hover:text-red-600"
          >
            <X className="size-3.5" />
            Reject
          </button>
          <button
            onClick={() => set(a.id, "approved")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-2.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-signal-strong"
          >
            <Check className="size-3.5" />
            Approve
          </button>
        </div>
      );
    }
    return (
      <div className="flex justify-end">
        <button
          onClick={() => set(a.id, "pending")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* search */}
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search approvals…"
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

        {/* status filter — segmented */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-1">
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

        {/* view toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-line bg-card p-1">
          <button
            onClick={() => setView("table")}
            aria-label="Table view"
            className={cn(
              "grid size-7 place-items-center rounded-lg transition-colors",
              view === "table"
                ? "bg-signal-soft text-signal-strong"
                : "text-ink-soft hover:text-ink",
            )}
          >
            <Table2 className="size-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            className={cn(
              "grid size-7 place-items-center rounded-lg transition-colors",
              view === "grid"
                ? "bg-signal-soft text-signal-strong"
                : "text-ink-soft hover:text-ink",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {/* empty matches */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-card py-16 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-secondary text-ink-soft">
            <Search className="size-5" />
          </span>
          <p className="text-[15px] font-bold text-ink">No matching approvals</p>
          <p className="text-[13px] text-ink-soft">
            Try a different search or status filter.
          </p>
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card shadow-card">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-paper-raised text-[11px] font-bold tracking-wide text-ink-soft uppercase">
                <th className="px-4 py-2.5 font-bold">Request</th>
                <th className="px-4 py-2.5 font-bold">Requested by</th>
                <th className="px-4 py-2.5 font-bold">Approver</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold">Date</th>
                <th className="px-4 py-2.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-paper-raised"
                >
                  <td className="px-4 py-3 align-top">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {a.title}
                    </p>
                    <p className="mt-0.5 max-w-[340px] text-[12px] text-ink-soft">
                      {a.note}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <Person id={a.requestedById} />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <Person id={a.approverId} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={statusOf(a)} />
                  </td>
                  <td className="tnum px-4 py-3 align-middle text-[12.5px] whitespace-nowrap text-ink-muted">
                    {a.date}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    {actions(a)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((a) => {
            const requester = memberById(a.requestedById);
            const approver = memberById(a.approverId);
            return (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-bold text-ink">{a.title}</h3>
                  <StatusBadge status={statusOf(a)} />
                </div>
                <p className="text-[12.5px] text-ink-muted">{a.note}</p>
                <div className="mt-auto flex flex-col gap-1.5 border-t border-line pt-3 text-[12px] text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    {requester && (
                      <Avatar
                        initials={requester.initials}
                        hue={requester.hue}
                        size={20}
                      />
                    )}
                    Requested by {requester?.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {approver && (
                      <Avatar
                        initials={approver.initials}
                        hue={approver.hue}
                        size={20}
                      />
                    )}
                    Approver {approver?.name}
                  </span>
                  <span className="tnum">{a.date}</span>
                </div>
                {actions(a)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
