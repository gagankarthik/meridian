"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Flag,
  GripVertical,
  ListFilter,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  getTaskDetail,
  priorityMeta,
  subtaskKey,
  taskKey,
  type Priority,
  type Task,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { AvatarStack, ProgressBar } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

const GROUP_TINT: Record<string, string> = {
  backlog: "#8b909c",
  todo: "#2f6df0",
  in_progress: "#e2a200",
  review: "#2563eb",
  done: "#22a06b",
};

const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];

// Single grid template shared by header / group / task / child rows so that
// every column lines up like a real spreadsheet. Each non-first cell carries a
// left border to form subtle vertical separators.
const GRID =
  "grid grid-cols-[32px_36px_minmax(220px,1.4fr)_minmax(200px,1.6fr)_110px_120px_130px_180px]";

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
  const canEdit = ws.can("edit");
  const canCreate = ws.can("create");

  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<string | null>(null);

  const projectTasks = useMemo(
    () => ws.tasks.filter((t) => t.projectId === projectId),
    [ws.tasks, projectId],
  );

  const q = query.trim().toLowerCase();
  const matches = (t: Task) =>
    (!q || t.title.toLowerCase().includes(q)) &&
    (!assigneeFilter || t.assigneeIds.includes(assigneeFilter)) &&
    (!priorityFilter || t.priority === priorityFilter);

  const visibleTasks = useMemo(
    () => projectTasks.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectTasks, q, assigneeFilter, priorityFilter],
  );

  const activeFilters = (assigneeFilter ? 1 : 0) + (priorityFilter ? 1 : 0);

  const assigneesInProject = useMemo(
    () =>
      ws.members.filter((m) =>
        projectTasks.some((t) => t.assigneeIds.includes(m.id)),
      ),
    [projectTasks],
  );

  function toggleExpanded(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function clearFilters() {
    setAssigneeFilter(null);
    setPriorityFilter(null);
  }

  function commitAdd(colId: string) {
    const title = draftTitle.trim();
    if (title) {
      ws.addTask({
        title,
        column: colId,
        projectId,
        tag: "Task",
        tagColor: "#2563eb",
      });
    }
    setDraftTitle("");
    setAdding(null);
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
      {/* top bar: search beside filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks…"
              className="w-full rounded-xl border border-line bg-card py-1.5 pl-8 pr-8 text-[13px] text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition-colors",
                activeFilters > 0
                  ? "border-signal/40 bg-signal-soft text-signal-strong"
                  : "border-line bg-card text-ink-muted hover:text-ink",
              )}
            >
              <ListFilter className="size-3.5" />
              Filter
              {activeFilters > 0 && (
                <span className="tnum grid size-4 place-items-center rounded-full bg-signal text-[10px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </button>

            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setFilterOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-card p-3 shadow-raised"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                      Filters
                    </span>
                    {activeFilters > 0 && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-signal hover:text-signal-strong"
                      >
                        <X className="size-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  <label className="mb-1 block text-[11px] font-semibold text-ink-muted">
                    Assignee
                  </label>
                  <select
                    value={assigneeFilter ?? ""}
                    onChange={(e) => setAssigneeFilter(e.target.value || null)}
                    className="mb-3 w-full rounded-lg border border-line bg-paper-raised px-2 py-1.5 text-[12.5px] text-ink focus:border-signal focus:outline-none"
                  >
                    <option value="">Anyone</option>
                    {assigneesInProject.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <label className="mb-1 block text-[11px] font-semibold text-ink-muted">
                    Priority
                  </label>
                  <select
                    value={priorityFilter ?? ""}
                    onChange={(e) =>
                      setPriorityFilter((e.target.value as Priority) || null)
                    }
                    className="w-full rounded-lg border border-line bg-paper-raised px-2 py-1.5 text-[12.5px] text-ink focus:border-signal focus:outline-none"
                  >
                    <option value="">Any priority</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </motion.div>
              </>
            )}
          </div>
        </div>

        <p className="text-[12.5px] text-ink-soft">
          <span className="tnum font-semibold text-ink-muted">
            {visibleTasks.length}
          </span>{" "}
          {visibleTasks.length === 1 ? "task" : "tasks"}
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
            <span>Description</span>
            <span>Assignees</span>
            <span>Priority</span>
            <span>Due</span>
            <span>Progress</span>
          </div>

          {ws.columns.map((col) => {
            const rows = visibleTasks.filter((t) => t.column === col.id);
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
                {/* collapsible group pill header */}
                <button
                  onClick={() => ws.toggleColumn(col.id)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-paper-raised"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3.5 text-ink-soft" />
                  ) : (
                    <ChevronDown className="size-3.5 text-ink-soft" />
                  )}
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-bold"
                    style={{
                      color: tint,
                      background: `color-mix(in srgb, ${tint} 14%, white)`,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: tint }}
                    />
                    {col.name}
                  </span>
                  <span className="tnum text-[12px] font-semibold text-ink-soft">
                    {rows.length}
                  </span>
                  {isDropTarget && draggingElsewhere && (
                    <span className="ml-auto text-[11px] font-semibold text-signal">
                      Drop to move here
                    </span>
                  )}
                </button>

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

                    {/* per-group add task footer */}
                    {canCreate &&
                      (adding === col.id ? (
                        <div className="flex items-center gap-2 px-4 py-2">
                          <input
                            autoFocus
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitAdd(col.id);
                              if (e.key === "Escape") {
                                setDraftTitle("");
                                setAdding(null);
                              }
                            }}
                            onBlur={() => commitAdd(col.id)}
                            placeholder="Task title…"
                            className="w-full max-w-sm rounded-lg border border-signal bg-card px-2.5 py-1.5 text-[13px] text-ink focus:outline-none"
                          />
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => commitAdd(col.id)}
                            className="rounded-lg bg-signal px-2.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-signal-strong"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setDraftTitle("");
                            setAdding(col.id);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-paper-raised hover:text-ink"
                        >
                          <Plus className="size-3.5" />
                          Add task
                        </button>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
