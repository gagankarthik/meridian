"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { priorityMeta, taskKey } from "@/lib/app-data";
import { AvatarStack } from "@/components/app/widgets";
import { ProjectViewHeader } from "@/components/app/view-tabs";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

export function BoardClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();

  // Task drag
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  // Column add / rename / drag-reorder / remove
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [menuCol, setMenuCol] = useState<string | null>(null);
  const [renameCol, setRenameCol] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [colDragId, setColDragId] = useState<string | null>(null);
  const [colOverId, setColOverId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const canCreate = ws.can("create");
  const canEdit = ws.can("edit");
  const canManage = ws.can("manage");

  const projectTasks = useMemo(
    () => ws.tasks.filter((t) => t.projectId === projectId),
    [ws.tasks, projectId],
  );
  const cols = ws.columnsForProject(projectId);

  function handleDrop(columnId: string) {
    if (canEdit && dragId) ws.moveTask(dragId, columnId);
    setDragId(null);
    setOverCol(null);
  }

  function submitColumn() {
    const name = newColumnName.trim();
    if (name) ws.addColumn(name, projectId);
    setNewColumnName("");
    setAddingColumn(false);
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

  // Drag-and-drop reorder: drop the dragged column at the target's position.
  function dropColumn(targetId: string) {
    if (!colDragId || colDragId === targetId) {
      setColDragId(null);
      setColOverId(null);
      return;
    }
    const ids = cols.map((c) => c.id).filter((id) => id !== colDragId);
    const at = ids.indexOf(targetId);
    ids.splice(at < 0 ? ids.length : at, 0, colDragId);
    ws.reorderColumns(projectId, ids);
    setColDragId(null);
    setColOverId(null);
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

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* No in-view filter — the project tab strip already provides search + filter. */}
      <ProjectViewHeader current="board" projectId={projectId} />

      {/* Columns */}
      <div className="min-h-0 flex-1 overflow-x-auto p-5 sm:p-6">
        <div className="flex h-full min-w-max items-stretch gap-4">
          {cols.map((col, idx) => {
            const collapsed = ws.collapsed.has(col.id);
            const colTasks = projectTasks.filter((t) => t.column === col.id);
            const isOver = overCol === col.id;
            const isColOver = colOverId === col.id && colDragId !== col.id;

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
                  onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                  onDrop={() => handleDrop(col.id)}
                  className={cn(
                    "flex w-11 shrink-0 flex-col items-center gap-3 rounded-xl border bg-paper-raised py-3 transition-colors",
                    isOver ? "border-signal bg-signal/5" : "border-line hover:bg-sunken",
                  )}
                  title={`Expand ${col.name}`}
                >
                  <ChevronRight className="size-4 text-ink-soft" strokeWidth={1.8} />
                  <span className="tnum grid size-5 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-ink-muted">
                    {colTasks.length}
                  </span>
                  <span className="flex-1 text-[12.5px] font-bold tracking-tight text-ink" style={{ writingMode: "vertical-rl" }}>
                    {col.name}
                  </span>
                </button>
              );
            }

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  if (colDragId) {
                    e.preventDefault();
                    setColOverId(col.id);
                  } else if (canEdit) {
                    e.preventDefault();
                    setOverCol(col.id);
                  }
                }}
                onDragLeave={() => {
                  setOverCol((c) => (c === col.id ? null : c));
                  setColOverId((c) => (c === col.id ? null : c));
                }}
                onDrop={() => (colDragId ? dropColumn(col.id) : handleDrop(col.id))}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-xl border bg-paper-raised/60 transition-colors",
                  isColOver
                    ? "border-signal ring-2 ring-signal/30"
                    : isOver
                      ? "border-signal bg-signal/5"
                      : "border-line",
                  colDragId === col.id && "opacity-50",
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between gap-1 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {canManage && (
                      <span
                        draggable
                        onDragStart={() => setColDragId(col.id)}
                        onDragEnd={() => {
                          setColDragId(null);
                          setColOverId(null);
                        }}
                        className="grid size-5 shrink-0 cursor-grab place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        <GripVertical className="size-3.5" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => ws.toggleColumn(col.id)}
                      className="grid size-5 shrink-0 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                      title="Collapse column"
                    >
                      <ChevronLeft className="size-3.5" />
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
                        className="min-w-0 flex-1 rounded-md border border-signal/40 bg-card px-1.5 py-0.5 text-[12.5px] font-bold text-ink outline-none"
                      />
                    ) : (
                      <span className="truncate text-[12.5px] font-bold text-ink">
                        {col.name}
                      </span>
                    )}
                    <span className="tnum grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-ink-muted">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* 3-dots menu */}
                  {canEdit && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setMenuCol((c) => (c === col.id ? null : col.id))}
                        className="grid size-5 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                        title="Column options"
                        aria-label="Column options"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                      {menuCol === col.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuCol(null)} />
                          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-popover p-1 shadow-float">
                            <MenuRow icon={Pencil} onClick={() => startRename(col.id, col.name)}>
                              Rename
                            </MenuRow>
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
                                <MenuRow icon={ArrowLeft} disabled={idx === 0} onClick={() => moveColumn(col.id, -1)}>
                                  Move left
                                </MenuRow>
                                <MenuRow icon={ArrowRight} disabled={idx === cols.length - 1} onClick={() => moveColumn(col.id, 1)}>
                                  Move right
                                </MenuRow>
                                <div className="my-1 border-t border-line" />
                                <MenuRow
                                  icon={Trash2}
                                  danger
                                  disabled={cols.length <= 1}
                                  onClick={() => {
                                    setMenuCol(null);
                                    setRemoveTarget({ id: col.id, name: col.name });
                                  }}
                                >
                                  Remove column
                                </MenuRow>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
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
                          canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                          dragId === t.id && "opacity-40",
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full" style={{ background: t.tagColor }} />
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
                        <p className="text-[13px] font-semibold leading-snug text-ink">{t.title}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <AvatarStack ids={t.assigneeIds} size={22} />
                          <span className="tnum flex items-center gap-1.5 text-[10px] font-medium text-ink-soft">
                            <span className="font-mono font-semibold text-ink-muted">{taskKey(t)}</span>
                            <span className="text-ink-soft/40">·</span>
                            {t.due}
                          </span>
                        </div>
                      </article>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-line py-6 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                      Drop here
                    </div>
                  )}
                </div>

                {/* Add task footer — opens the full form with project + status fixed */}
                {canCreate && (
                  <Link
                    href={`/app/tasks/new?project=${projectId}&status=${col.id}`}
                    className="m-2.5 mt-0 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
                  >
                    <Plus className="size-3.5" />
                    Add task
                  </Link>
                )}
              </div>
            );
          })}

          {/* Add column */}
          {canManage && (
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

      <ColumnRemoveDialog
        target={removeTarget}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={confirmRemoveColumn}
      />
    </div>
  );
}

/* ---- Column menu row ---- */
function MenuRow({
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
