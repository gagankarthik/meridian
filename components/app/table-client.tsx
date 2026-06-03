"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Flag,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getTaskDetail,
  priorityMeta,
  subtaskKey,
  taskKey,
  ticketTypeOf,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { AvatarStack, ProgressBar } from "@/components/app/widgets";
import { TicketTypeIcon } from "@/components/app/ticket-type";
import { cn } from "@/lib/utils";

const GROUP_TINT: Record<string, string> = {
  backlog: "#8b909c",
  todo: "#2f6df0",
  in_progress: "#e2a200",
  review: "#2563eb",
  done: "#22a06b",
};

// Single grid template shared by header / group / task / child rows so that
// every column lines up like a real spreadsheet. Each non-first cell carries a
// left border to form subtle vertical separators.
const GRID =
  "grid grid-cols-[32px_36px_minmax(220px,1.4fr)_112px_minmax(200px,1.6fr)_110px_120px_130px_180px]";

function progressFor(column: string) {
  const base: Record<string, number> = {
    backlog: 10,
    todo: 20,
    in_progress: 45,
    review: 80,
    done: 100,
  };
  return base[column] ?? 10;
}

export function TableClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const canEdit = ws.canInProject(projectId, "edit");
  const canCreate = ws.canInProject(projectId, "create");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<string | null>(null);
  const [menuCol, setMenuCol] = useState<string | null>(null);
  const [renameCol, setRenameCol] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const canManage = ws.canInProject(projectId, "manage");

  const projectTasks = useMemo(
    () => ws.tasks.filter((t) => t.projectId === projectId),
    [ws.tasks, projectId],
  );
  const cols = ws.columnsForProject(projectId);

  function toggleExpanded(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function startRename(id: string, name: string) {
    setRenameCol(id);
    setRenameValue(name);
    setMenuCol(null);
  }
  function submitRename() {
    if (renameCol) ws.renameColumn(renameCol, renameValue, projectId);
    setRenameCol(null);
  }
  function moveColumn(id: string, dir: -1 | 1) {
    const ids = cols.map((c) => c.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    ws.reorderColumns(projectId, ids);
    setMenuCol(null);
  }
  function confirmRemoveColumn() {
    if (!removeTarget) return;
    const remaining = cols.filter((c) => c.id !== removeTarget.id);
    const fallback = remaining[0]?.id;
    if (fallback) {
      projectTasks
        .filter((t) => t.column === removeTarget.id)
        .forEach((t) => ws.moveTask(t.id, fallback));
    }
    ws.removeColumn(removeTarget.id, projectId);
    setRemoveTarget(null);
  }

  function handleDrop(colId: string) {
    if (dragId) {
      const task = projectTasks.find((t) => t.id === dragId);
      if (task && task.column !== colId) ws.moveTask(dragId, colId);
    }
    setDragId(null);
    setDropCol(null);
  }

  return (
    <div className="p-4 sm:p-6">
      {/* No in-view filter — search + filter live on the project tab strip. */}
      <div className="mb-4 flex items-center justify-end">
        <p className="text-[12.5px] text-ink-soft">
          <span className="tnum font-semibold text-ink-muted">
            {projectTasks.length}
          </span>{" "}
          {projectTasks.length === 1 ? "task" : "tasks"}
        </p>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card shadow-card">
        <div className="min-w-[900px]">
          {/* sticky header */}
          <div
            className={cn(
              GRID,
              "sticky top-0 z-10 border-b border-line bg-paper-raised text-[11px] font-bold uppercase tracking-wide text-ink-soft",
              "[&>span]:flex [&>span]:items-center [&>span]:px-3 [&>span]:py-2.5",
              "[&>span:not(:first-child)]:border-l [&>span:not(:first-child)]:border-line",
            )}
          >
            <span />
            <span />
            <span>Task</span>
            <span>Type</span>
            <span>Description</span>
            <span>Assignees</span>
            <span>Priority</span>
            <span>Due</span>
            <span>Progress</span>
          </div>

          {cols.map((col, idx) => {
            const rows = projectTasks.filter((t) => t.column === col.id);
            const tint = GROUP_TINT[col.id] ?? "#2563eb";
            const isCollapsed = ws.collapsed.has(col.id);
            const isDropTarget = dropCol === col.id;
            const draggingElsewhere =
              dragId != null &&
              projectTasks.find((t) => t.id === dragId)?.column !== col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  if (!canEdit || dragId == null) return;
                  e.preventDefault();
                  if (dropCol !== col.id) setDropCol(col.id);
                }}
                onDragLeave={(e) => {
                  // only clear when leaving the group entirely
                  if (
                    !e.currentTarget.contains(e.relatedTarget as Node) &&
                    dropCol === col.id
                  ) {
                    setDropCol(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(col.id);
                }}
                className={cn(
                  "border-b border-line last:border-b-0 transition-colors",
                  isDropTarget && draggingElsewhere && "bg-signal-soft/60",
                )}
              >
                {/* collapsible group header + 3-dots menu */}
                <div className="flex w-full items-center gap-2 px-4 py-2.5 transition-colors hover:bg-paper-raised">
                  <button
                    type="button"
                    onClick={() => ws.toggleColumn(col.id)}
                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                    className="grid size-5 shrink-0 place-items-center rounded text-ink-soft hover:text-ink"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                  </button>
                  {renameCol === col.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename();
                        if (e.key === "Escape") setRenameCol(null);
                      }}
                      className="rounded-md border border-signal/40 bg-card px-2 py-0.5 text-[12px] font-bold text-ink outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => ws.toggleColumn(col.id)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-bold"
                      style={{ color: tint, background: `color-mix(in srgb, ${tint} 14%, white)` }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: tint }} />
                      {col.name}
                    </button>
                  )}
                  <span className="tnum text-[12px] font-semibold text-ink-soft">
                    {rows.length}
                  </span>
                  {isDropTarget && draggingElsewhere && (
                    <span className="text-[11px] font-semibold text-signal">
                      Drop to move here
                    </span>
                  )}

                  {canEdit && (
                    <div className="relative ml-auto">
                      <button
                        type="button"
                        onClick={() => setMenuCol((c) => (c === col.id ? null : col.id))}
                        className="grid size-6 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                        aria-label="Column options"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                      {menuCol === col.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuCol(null)} />
                          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-popover p-1 shadow-float">
                            <GroupMenuRow icon={Pencil} onClick={() => startRename(col.id, col.name)}>
                              Rename
                            </GroupMenuRow>
                            <Link
                              href={`/app/tasks/new?project=${projectId}&status=${col.id}`}
                              onClick={() => setMenuCol(null)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium text-ink transition-colors hover:bg-secondary"
                            >
                              <Plus className="size-3.5 text-ink-soft" />
                              New task
                            </Link>
                            {canManage && (
                              <>
                                <GroupMenuRow icon={ArrowUp} disabled={idx === 0} onClick={() => moveColumn(col.id, -1)}>
                                  Move up
                                </GroupMenuRow>
                                <GroupMenuRow icon={ArrowDown} disabled={idx === cols.length - 1} onClick={() => moveColumn(col.id, 1)}>
                                  Move down
                                </GroupMenuRow>
                                <div className="my-1 border-t border-line" />
                                <GroupMenuRow
                                  icon={Trash2}
                                  danger
                                  disabled={cols.length <= 1}
                                  onClick={() => {
                                    setMenuCol(null);
                                    setRemoveTarget({ id: col.id, name: col.name });
                                  }}
                                >
                                  Remove column
                                </GroupMenuRow>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="border-t border-line">
                    {rows.map((t) => {
                      const pr = priorityMeta[t.priority];
                      const isDone = t.column === "done";
                      const pct = progressFor(t.column);
                      const detail = getTaskDetail(t);
                      const isExpanded = expanded.has(t.id);
                      const isDragging = dragId === t.id;
                      return (
                        <div key={t.id}>
                          {/* task row */}
                          <div
                            draggable={canEdit}
                            onDragStart={(e) => {
                              if (!canEdit) return;
                              setDragId(t.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              setDragId(null);
                              setDropCol(null);
                            }}
                            onClick={() => ws.openTask(t.id)}
                            className={cn(
                              GRID,
                              "group cursor-pointer border-b border-line text-[13px] transition-colors hover:bg-paper-raised",
                              "[&>div]:flex [&>div]:min-w-0 [&>div]:items-center [&>div]:px-3 [&>div]:py-2.5",
                              "[&>div:not(:first-child)]:border-l [&>div:not(:first-child)]:border-line",
                              isDragging && "opacity-40",
                            )}
                          >
                            {/* drag handle */}
                            <div className="justify-center !px-0">
                              {canEdit && (
                                <GripVertical className="size-3.5 cursor-grab text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
                              )}
                            </div>

                            {/* done checkbox */}
                            <div className="justify-center !px-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!canEdit) return;
                                  ws.updateTask(t.id, { column: "done" });
                                }}
                                aria-label="Mark done"
                                disabled={!canEdit}
                                className={cn(
                                  "grid size-5 place-items-center rounded-[5px] border transition-colors",
                                  isDone
                                    ? "text-white"
                                    : "border-line hover:border-signal",
                                  !canEdit && "cursor-default",
                                )}
                                style={
                                  isDone
                                    ? {
                                        borderColor: "#22a06b",
                                        background: "#22a06b",
                                      }
                                    : undefined
                                }
                              >
                                {isDone && (
                                  <Check className="size-3" strokeWidth={3} />
                                )}
                              </button>
                            </div>

                            {/* task: caret + tag dot + title */}
                            <div className="gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(t.id);
                                }}
                                aria-label={
                                  isExpanded
                                    ? "Collapse subtasks"
                                    : "Expand subtasks"
                                }
                                className="grid size-4 shrink-0 place-items-center rounded text-ink-soft transition-colors hover:text-ink"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronRight className="size-3.5" />
                                )}
                              </button>
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ background: t.tagColor }}
                              />
                              <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-soft">
                                {taskKey(t)}
                              </span>
                              <span
                                className={cn(
                                  "truncate font-medium text-ink",
                                  isDone && "text-ink-soft line-through",
                                )}
                              >
                                {t.title}
                              </span>
                            </div>

                            {/* ticket type */}
                            <div className="gap-1.5">
                              <TicketTypeIcon
                                type={ticketTypeOf(t)}
                                className="size-3.5 shrink-0"
                              />
                              <span className="truncate text-[12.5px] font-medium text-ink-muted">
                                {ticketTypeOf(t)}
                              </span>
                            </div>

                            {/* description (1-line truncated) */}
                            <div>
                              <span className="truncate text-[12.5px] text-ink-soft">
                                {detail.description}
                              </span>
                            </div>

                            {/* assignees */}
                            <div>
                              {t.assigneeIds.length > 0 ? (
                                <AvatarStack ids={t.assigneeIds} size={24} />
                              ) : (
                                <span className="text-[12.5px] text-ink-soft">
                                  —
                                </span>
                              )}
                            </div>

                            {/* priority */}
                            <div>
                              <span
                                className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-semibold"
                                style={{ color: pr.color }}
                              >
                                <Flag
                                  className="size-3.5"
                                  style={{ fill: pr.color, color: pr.color }}
                                />
                                {pr.label}
                                <span className="hidden text-ink-soft xl:inline">
                                  {t.priority}
                                </span>
                              </span>
                            </div>

                            {/* due */}
                            <div>
                              <span className="tnum text-[12.5px] text-ink-muted">
                                {t.due}
                              </span>
                            </div>

                            {/* progress */}
                            <div className="gap-2">
                              <ProgressBar
                                value={pct}
                                color={isDone ? "#22a06b" : "var(--signal)"}
                              />
                              <span className="tnum w-9 shrink-0 text-right text-[11px] font-semibold text-ink-muted">
                                {pct}%
                              </span>
                            </div>
                          </div>

                          {/* subtask tree (indented child rows) */}
                          {isExpanded &&
                            detail.subtasks.map((s, si) => {
                              const last = si === detail.subtasks.length - 1;
                              return (
                                <div
                                  key={s.id}
                                  className={cn(
                                    GRID,
                                    "border-b border-line bg-paper-raised/40 text-[13px]",
                                    "[&>div]:flex [&>div]:min-w-0 [&>div]:items-center [&>div]:px-3 [&>div]:py-2",
                                    "[&>div:not(:first-child)]:border-l [&>div:not(:first-child)]:border-line",
                                  )}
                                >
                                  <div className="!px-0" />
                                  <div className="!px-0" />
                                  {/* tree connector + title */}
                                  <div className="!pl-7 gap-2">
                                    <span className="relative flex h-full w-3 shrink-0 items-center">
                                      <span className="absolute left-0 top-0 h-1/2 w-px bg-line" />
                                      {!last && (
                                        <span className="absolute bottom-0 left-0 h-1/2 w-px bg-line" />
                                      )}
                                      <span className="absolute left-0 top-1/2 h-px w-2.5 bg-line" />
                                    </span>
                                    <span
                                      className={cn(
                                        "grid size-4 shrink-0 place-items-center rounded-[4px] border",
                                        s.done
                                          ? "border-signal bg-signal text-white"
                                          : "border-line",
                                      )}
                                    >
                                      {s.done && (
                                        <Check
                                          className="size-2.5"
                                          strokeWidth={3}
                                        />
                                      )}
                                    </span>
                                    <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-soft/80">
                                      {subtaskKey(t, si)}
                                    </span>
                                    <span
                                      className={cn(
                                        "truncate text-[12.5px]",
                                        s.done
                                          ? "text-ink-soft line-through"
                                          : "text-ink-muted",
                                      )}
                                    >
                                      {s.title}
                                    </span>
                                  </div>
                                  <div />
                                  <div />
                                  <div />
                                  <div />
                                  <div />
                                  <div />
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}

                    {rows.length === 0 && (
                      <div className="border-b border-line px-4 py-3 text-[12px] text-ink-soft">
                        No tasks.
                      </div>
                    )}

                    {/* per-group add task — opens the full form, status fixed */}
                    {canCreate && (
                      <Link
                        href={`/app/tasks/new?project=${projectId}&status=${col.id}`}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
                      >
                        <Plus className="size-3.5" />
                        Add task
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ColumnRemoveDialog
        target={removeTarget}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={confirmRemoveColumn}
      />
    </div>
  );
}

/* ---- Column menu row ---- */
function GroupMenuRow({
  icon: Icon,
  children,
  onClick,
  danger,
  disabled,
}: {
  icon: typeof Pencil;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "text-red-700 hover:bg-red-500/10 dark:text-red-300"
          : "text-ink hover:bg-secondary",
      )}
    >
      <Icon className={cn("size-3.5", !danger && "text-ink-soft")} />
      {children}
    </button>
  );
}

/* ---- Remove-column confirmation dialog ---- */
function ColumnRemoveDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: { id: string; name: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {target && (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onCancel}
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[400px] rounded-2xl border border-line bg-card p-6 shadow-float"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-red-500/10 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-[18px] font-extrabold tracking-tight text-ink">
              Remove “{target.name}”?
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              The column will be removed for this project. Any tasks in it move to
              the first column — no work is lost.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-line bg-card px-4 py-2.5 text-[13px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={onConfirm}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-red-700"
              >
                Remove column
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
