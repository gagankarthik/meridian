"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  priorityMeta,
  taskKey,
  type Priority,
} from "@/lib/app-data";
import { Avatar, AvatarStack } from "@/components/app/widgets";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];

const DEFAULT_COLUMN_IDS = new Set(["backlog", "in_progress", "review", "done"]);

export function BoardClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  // Inline composers / editors
  const [composerCol, setComposerCol] = useState<string | null>(null);
  const [composerTitle, setComposerTitle] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [menuCol, setMenuCol] = useState<string | null>(null);

  // Filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());

  const canCreate = ws.can("create");
  const canEdit = ws.can("edit");

  const projectTasks = useMemo(
    () => ws.tasks.filter((t) => t.projectId === projectId),
    [ws.tasks, projectId],
  );

  const activeFilterCount = assigneeFilter.size + priorityFilter.size;

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projectTasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query)) {
        return false;
      }
      if (
        assigneeFilter.size > 0 &&
        !t.assigneeIds.some((id) => assigneeFilter.has(id))
      ) {
        return false;
      }
      if (priorityFilter.size > 0 && !priorityFilter.has(t.priority)) {
        return false;
      }
      return true;
    });
  }, [projectTasks, search, assigneeFilter, priorityFilter]);

  function toggleAssignee(id: string) {
    setAssigneeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePriority(p: Priority) {
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function clearFilters() {
    setAssigneeFilter(new Set());
    setPriorityFilter(new Set());
  }

  function handleDrop(columnId: string) {
    if (canEdit && dragId) ws.moveTask(dragId, columnId);
    setDragId(null);
    setOverCol(null);
  }

  function submitTask(columnId: string) {
    const title = composerTitle.trim();
    if (title) {
      ws.addTask({
        title,
        column: columnId,
        projectId,
        tag: "Task",
        tagColor: "#2563eb",
      });
    }
    setComposerTitle("");
    setComposerCol(null);
  }

  function submitColumn() {
    const name = newColumnName.trim();
    if (name) ws.addColumn(name);
    setNewColumnName("");
    setAddingColumn(false);
  }

  const toolbar = (
    <>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft"
          strokeWidth={1.8}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-40 rounded-lg border border-line bg-card py-1.5 pl-8 pr-7 text-[12.5px] font-medium text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal focus:bg-paper sm:w-52"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
            title="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
              filterOpen || activeFilterCount > 0
                ? "border-signal bg-signal-soft text-signal"
                : "border-line bg-card text-ink-muted hover:bg-sunken hover:text-ink",
            )}
          >
            <Filter className="size-3.5" strokeWidth={1.8} />
            Filter
            {activeFilterCount > 0 && (
              <span className="tnum grid size-4 place-items-center rounded-full bg-signal text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setFilterOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-line bg-card p-3 shadow-raised">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                    Assignee
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] font-semibold text-signal hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-0.5">
                  {ws.members.map((m) => {
                    const on = assigneeFilter.has(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignee(m.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sunken"
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded border",
                            on
                              ? "border-signal bg-signal text-white"
                              : "border-line bg-card",
                          )}
                        >
                          {on && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <Avatar initials={m.initials} hue={m.hue} size={20} />
                        <span className="truncate text-[12.5px] font-medium text-ink">
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 border-t border-line pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                    Priority
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PRIORITIES.map((p) => {
                      const on = priorityFilter.has(p);
                      const meta = priorityMeta[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePriority(p)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
                            on
                              ? "border-signal bg-signal-soft text-signal"
                              : "border-line bg-card text-ink-muted hover:bg-sunken",
                          )}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ background: meta.color }}
                          />
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
    </>
  );

  return (
    <div className="flex h-full flex-col bg-paper">
      <ProjectViewHeader
        current="board"
        projectId={projectId}
        toolbar={toolbar}
      />

      {/* Columns */}
      <div className="min-h-0 flex-1 overflow-x-auto p-5 sm:p-6">
        <div className="flex h-full min-w-max items-stretch gap-4">
          {ws.columns.map((col) => {
            const collapsed = ws.collapsed.has(col.id);
            const allColTasks = projectTasks.filter((t) => t.column === col.id);
            const colTasks = visibleTasks.filter((t) => t.column === col.id);
            const isOver = overCol === col.id;

            if (collapsed) {
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => ws.toggleColumn(col.id)}
                  onDragOver={(e) => {
                    if (!canEdit) return;
                    e.preventDefault();
                    setOverCol(col.id);
                  }}
                  onDragLeave={() =>
                    setOverCol((c) => (c === col.id ? null : c))
                  }
                  onDrop={() => handleDrop(col.id)}
                  className={cn(
                    "flex w-11 shrink-0 flex-col items-center gap-3 rounded-xl border bg-paper-raised py-3 transition-colors",
                    isOver
                      ? "border-signal bg-signal/5"
                      : "border-line hover:bg-sunken",
                  )}
                  title={`Expand ${col.name}`}
                >
                  <ChevronRight
                    className="size-4 text-ink-soft"
                    strokeWidth={1.8}
                  />
                  <span className="tnum grid size-5 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-ink-muted">
                    {colTasks.length}
                  </span>
                  <span
                    className="flex-1 text-[12.5px] font-bold tracking-tight text-ink"
                    style={{ writingMode: "vertical-rl" }}
                  >
                    {col.name}
                  </span>
                </button>
              );
            }

            const removable =
              canEdit && !DEFAULT_COLUMN_IDS.has(col.id) && allColTasks.length === 0;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  setOverCol(col.id);
                }}
                onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                onDrop={() => handleDrop(col.id)}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-xl border bg-paper-raised/60 transition-colors",
                  isOver ? "border-signal bg-signal/5" : "border-line",
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between gap-1 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => ws.toggleColumn(col.id)}
                      className="grid size-5 shrink-0 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                      title="Collapse column"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <span className="truncate text-[12.5px] font-bold text-ink">
                      {col.name}
                    </span>
                    <span className="tnum grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-ink-muted">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => {
                          setComposerCol(col.id);
                          setComposerTitle("");
                        }}
                        className="grid size-5 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                        title="Add task"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    )}

                    {removable && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuCol((c) => (c === col.id ? null : col.id))
                          }
                          className="grid size-5 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                          title="Column options"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                        {menuCol === col.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuCol(null)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-line bg-card p-1 shadow-raised">
                              <button
                                type="button"
                                onClick={() => {
                                  ws.removeColumn(col.id);
                                  setMenuCol(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium text-red-700 transition-colors hover:bg-red-500/10"
                              >
                                <Trash2 className="size-3.5" />
                                Remove column
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2.5 px-2.5 pb-2.5">
                  {colTasks.map((t) => {
                    const pr = priorityMeta[t.priority];
                    return (
                      <article
                        key={t.id}
                        draggable={canEdit}
                        onDragStart={() => canEdit && setDragId(t.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverCol(null);
                        }}
                        onClick={() => ws.openTask(t.id)}
                        className={cn(
                          "group relative rounded-xl border border-line bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-raised",
                          canEdit
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-pointer",
                          dragId === t.id && "opacity-40",
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ background: t.tagColor }}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                              {t.tag}
                            </span>
                          </span>
                          <span
                            className="rounded-[4px] px-1 text-[9px] font-bold tracking-wide text-white"
                            style={{ background: pr.color }}
                          >
                            {pr.label}
                          </span>
                        </div>

                        <p className="text-[13px] font-semibold leading-snug text-ink">
                          {t.title}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <AvatarStack ids={t.assigneeIds} size={22} />
                          <span className="tnum flex items-center gap-1.5 text-[10px] font-medium text-ink-soft">
                            <span className="font-mono font-semibold text-ink-muted">
                              {taskKey(t)}
                            </span>
                            <span className="text-ink-soft/40">·</span>
                            {t.due}
                          </span>
                        </div>

                      </article>
                    );
                  })}

                  {/* Inline task composer */}
                  {canCreate && composerCol === col.id && (
                    <div className="rounded-xl border border-signal bg-card p-2 shadow-card">
                      <input
                        autoFocus
                        value={composerTitle}
                        onChange={(e) => setComposerTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitTask(col.id);
                          if (e.key === "Escape") {
                            setComposerTitle("");
                            setComposerCol(null);
                          }
                        }}
                        onBlur={() => submitTask(col.id)}
                        placeholder="Task title..."
                        className="w-full rounded-md bg-transparent px-1 py-0.5 text-[13px] font-medium text-ink outline-none placeholder:text-ink-soft"
                      />
                    </div>
                  )}

                  {colTasks.length === 0 &&
                    !(canCreate && composerCol === col.id) && (
                      <div className="rounded-xl border border-dashed border-line py-6 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        Drop here
                      </div>
                    )}
                </div>

                {/* Add task footer */}
                {canCreate && composerCol !== col.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerCol(col.id);
                      setComposerTitle("");
                    }}
                    className="m-2.5 mt-0 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
                  >
                    <Plus className="size-3.5" />
                    Add task
                  </button>
                )}
              </div>
            );
          })}

          {/* Add column */}
          {canCreate && (
            <div className="w-60 shrink-0">
              {addingColumn ? (
                <div className="rounded-xl border border-signal bg-card p-2 shadow-card">
                  <input
                    autoFocus
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitColumn();
                      if (e.key === "Escape") {
                        setNewColumnName("");
                        setAddingColumn(false);
                      }
                    }}
                    onBlur={submitColumn}
                    placeholder="Column name..."
                    className="w-full rounded-md bg-transparent px-1 py-1 text-[13px] font-semibold text-ink outline-none placeholder:text-ink-soft"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingColumn(true);
                    setNewColumnName("");
                  }}
                  className="inline-flex w-full items-center gap-1.5 rounded-xl border border-dashed border-line bg-paper-raised/40 px-3 py-2.5 text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-signal hover:text-signal"
                >
                  <Plus className="size-3.5" />
                  Add column
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
