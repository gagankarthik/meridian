"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Flag,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  COLUMN_LABEL,
  getTaskDetail,
  memberById,
  priorityMeta,
  projectById,
  subtaskKey,
  taskKey,
  type Priority,
  type SubTask,
  type Task,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { AvatarStack, MemberAvatar, ProgressBar } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

type Comment = { id: string; who: string; text: string; time: string };

export function TaskPage({ id }: { id: string }) {
  const ws = useWorkspace();
  const task = ws.tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <div className="grid h-full place-items-center bg-paper p-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-card p-8 text-center shadow-card">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-ink-soft">
            <X className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-[20px] font-extrabold tracking-tight text-ink">
            Task not found
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
            This task may have been deleted or the link is no longer valid.
          </p>
          <Link
            href="/app/board"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-signal-strong"
          >
            <ArrowLeft className="size-3.5" />
            Back to board
          </Link>
        </div>
      </div>
    );
  }

  return <TaskBody key={task.id} task={task} />;
}

function TaskBody({ task }: { task: Task }) {
  const ws = useWorkspace();
  const router = useRouter();
  const detail = getTaskDetail(task);

  const canEdit = ws.can("edit");
  const canAssign = ws.can("assign");
  const canDelete = ws.can("delete");

  // All local state seeded via useState initializers — TaskBody is keyed by
  // task.id, so this reseeds whenever a different task loads. No effect sync.
  const [subtasks, setSubtasks] = useState<SubTask[]>(() =>
    detail.subtasks.map((s) => ({ ...s })),
  );
  const [title, setTitle] = useState(() => task.title);
  const [description, setDescription] = useState(() => detail.description);
  const [newSub, setNewSub] = useState("");
  const [comments, setComments] = useState<Comment[]>(() => [
    {
      id: "c1",
      who: detail.reporterId,
      text: `Kicking this off under the ${task.tag} workstream — scope is captured above.`,
      time: "5h ago",
    },
    {
      id: "c2",
      who: task.assigneeId,
      text: `Picked it up. Moving to ${COLUMN_LABEL[task.column] ?? task.column} once the first sub-task lands.`,
      time: "2h ago",
    },
    {
      id: "c3",
      who: detail.reporterId,
      text: "Looks good — let's keep the checklist current and loop in review before sign-off.",
      time: "40m ago",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(() =>
    task.assigneeIds.length ? [...task.assigneeIds] : [task.assigneeId],
  );

  const reporter = memberById(detail.reporterId);
  const reviewer = memberById(detail.reviewerId);
  const project = projectById(task.projectId);
  const pr = priorityMeta[task.priority];

  const doneCount = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length
    ? Math.round((doneCount / subtasks.length) * 100)
    : 0;

  const commitTitle = () => {
    const next = title.trim();
    if (next && next !== task.title) ws.updateTask(task.id, { title: next });
    else if (!next) setTitle(task.title);
  };

  const toggleSub = (id: string) =>
    setSubtasks((list) =>
      list.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setSubtasks((list) => [
      ...list,
      { id: `${task.id}-n${Date.now()}`, title: t, done: false },
    ]);
    setNewSub("");
  };

  const removeSub = (id: string) =>
    setSubtasks((list) => list.filter((s) => s.id !== id));

  const sendComment = () => {
    const t = draft.trim();
    if (!t) return;
    setComments((list) => [
      ...list,
      { id: `c${Date.now()}`, who: "u1", text: t, time: "just now" },
    ]);
    setDraft("");
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds((current) => {
      const has = current.includes(id);
      let next = has ? current.filter((x) => x !== id) : [...current, id];
      if (next.length === 0) next = current.length ? current : [task.assigneeId];
      ws.updateTask(task.id, {
        assigneeIds: next,
        assigneeId: next[0] ?? task.assigneeId,
      });
      return next;
    });
  };

  const onDelete = () => {
    ws.deleteTask(task.id);
    router.push(`/app/board?project=${task.projectId}`);
  };

  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className="w-full max-w-[1100px] px-6 py-6">
        {/* ---- Top bar ---- */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink-soft shadow-card transition-colors hover:border-signal/40 hover:text-ink"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>

          <Link
            href={`/app/board?project=${task.projectId}`}
            className="flex min-w-0 items-center gap-2 text-[13px] font-semibold"
          >
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: project?.color }}
            />
            <span className="truncate text-ink-muted transition-colors hover:text-ink">
              {project?.name}
            </span>
            <span className="text-line-strong">/</span>
            <span className="shrink-0 font-mono text-ink-muted">
              {taskKey(task)}
            </span>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-[12px] font-bold text-ink">
            <span
              className="size-1.5 rounded-full"
              style={{ background: task.tagColor }}
            />
            {COLUMN_LABEL[task.column] ?? task.column}
          </span>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-red-600 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="size-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>

        {/* ---- Two-column layout ---- */}
        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          {/* MAIN */}
          <div className="min-w-0 lg:flex-1">
            {/* Title */}
            {canEdit ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="-mx-2 w-[calc(100%+1rem)] rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-[30px] leading-tight font-extrabold tracking-tight text-ink outline-none transition-colors hover:bg-paper-raised focus:border-signal/40 focus:bg-card"
              />
            ) : (
              <h1 className="font-display text-[30px] leading-tight font-extrabold tracking-tight text-ink">
                {title}
              </h1>
            )}

            {/* Description */}
            <Section title="Description">
              {canEdit ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Add a description…"
                  className="w-full resize-y rounded-xl border border-line bg-paper-raised px-4 py-3.5 text-[14px] leading-relaxed text-ink-muted outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40 focus:bg-card"
                />
              ) : (
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-ink-muted">
                  {description}
                </p>
              )}
            </Section>

            {/* Sub-tasks */}
            <Section title="Sub-tasks" meta={`${doneCount}/${subtasks.length}`}>
              <div className="mb-3">
                <ProgressBar value={pct} />
              </div>
              <div className="space-y-0.5">
                {subtasks.map((s, i) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-paper-raised"
                  >
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleSub(s.id)}
                      aria-label={s.done ? "Mark incomplete" : "Mark complete"}
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors",
                        s.done
                          ? "border-signal bg-signal text-white"
                          : "border-line-strong hover:border-signal",
                        !canEdit && "cursor-default",
                      )}
                    >
                      {s.done && <Check className="size-3" strokeWidth={3} />}
                    </button>
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-soft">
                      {subtaskKey(task, i)}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-[14px] text-ink",
                        s.done && "text-ink-soft line-through",
                      )}
                    >
                      {s.title}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeSub(s.id)}
                        aria-label="Delete sub-task"
                        className="grid size-6 shrink-0 place-items-center rounded-md text-ink-soft opacity-0 transition-all group-hover:opacity-100 hover:bg-secondary hover:text-red-600"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-paper-raised px-2.5 py-2 focus-within:border-signal/40">
                  <Plus className="size-3.5 shrink-0 text-ink-soft" />
                  <input
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSub()}
                    placeholder="Add a sub-task…"
                    className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-soft"
                  />
                  {newSub.trim() && (
                    <button
                      type="button"
                      onClick={addSub}
                      className="shrink-0 rounded-md bg-signal px-2 py-0.5 text-[12px] font-semibold text-white transition-colors hover:bg-signal-strong"
                    >
                      Add
                    </button>
                  )}
                </div>
              )}
            </Section>

            {/* Comments */}
            <Section title="Comments" meta={`${comments.length}`}>
              <div className="space-y-5">
                {comments.map((c) => {
                  const m = memberById(c.who);
                  return (
                    <div key={c.id} className="flex gap-3">
                      {m && (
                        <MemberAvatar member={m} size={32} className="mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13.5px] font-semibold text-ink">
                            {m?.name ?? "Unknown"}
                          </span>
                          <span className="text-[11px] text-ink-soft">
                            {c.time}
                          </span>
                        </div>
                        <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 focus-within:border-signal/40">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendComment()}
                  placeholder="Add a comment…"
                  className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-soft"
                />
                <button
                  type="button"
                  onClick={sendComment}
                  aria-label="Send comment"
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-signal text-white transition-colors hover:bg-signal-strong"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </Section>
          </div>

          {/* DETAILS SIDEBAR */}
          <div className="lg:w-[280px] lg:shrink-0">
            <div className="rounded-2xl border border-line bg-card px-5 py-3 shadow-card lg:sticky lg:top-6">
              {/* Status */}
              <Detail label="Status">
                {canEdit ? (
                  <Dropdown
                    trigger={
                      <>
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: task.tagColor }}
                        />
                        <span className="truncate">
                          {COLUMN_LABEL[task.column] ?? task.column}
                        </span>
                      </>
                    }
                  >
                    {(close) =>
                      ws.columns.map((col) => (
                        <MenuItem
                          key={col.id}
                          active={col.id === task.column}
                          onClick={() => {
                            ws.updateTask(task.id, { column: col.id });
                            close();
                          }}
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              col.id === task.column ? "bg-signal" : "bg-ink-soft",
                            )}
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{col.name}</span>
                        </MenuItem>
                      ))
                    }
                  </Dropdown>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-[12px] font-bold text-ink">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: task.tagColor }}
                    />
                    {COLUMN_LABEL[task.column] ?? task.column}
                  </span>
                )}
              </Detail>

              {/* Assignee (multi-select) */}
              <Detail label="Assignee">
                {canAssign ? (
                  <Dropdown trigger={<AssigneeSummary ids={assigneeIds} />}>
                    {() =>
                      ws.members.map((m) => {
                        const selected = assigneeIds.includes(m.id);
                        return (
                          <MenuItem
                            key={m.id}
                            active={selected}
                            onClick={() => toggleAssignee(m.id)}
                          >
                            <MemberAvatar member={m} size={22} />
                            <span className="flex-1 truncate">{m.name}</span>
                          </MenuItem>
                        );
                      })
                    }
                  </Dropdown>
                ) : (
                  <div className="px-2 py-1">
                    <AssigneeSummary ids={assigneeIds} />
                  </div>
                )}
              </Detail>

              {/* Reporter (read-only) */}
              <Detail label="Reporter">
                {reporter && (
                  <span className="flex items-center gap-2">
                    <MemberAvatar member={reporter} size={22} />
                    <span className="text-[13px] font-medium text-ink">
                      {reporter.name}
                    </span>
                  </span>
                )}
              </Detail>

              {/* Reviewer (read-only) */}
              <Detail label="Reviewer">
                {reviewer ? (
                  <span className="flex items-center gap-2">
                    <MemberAvatar member={reviewer} size={22} />
                    <span className="text-[13px] font-medium text-ink">
                      {reviewer.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-[13px] text-ink-soft">—</span>
                )}
              </Detail>

              {/* Priority */}
              <Detail label="Priority">
                {canEdit ? (
                  <Dropdown
                    trigger={
                      <>
                        <Flag
                          className="size-3.5 shrink-0"
                          style={{ fill: pr.color, color: pr.color }}
                        />
                        <span className="truncate" style={{ color: pr.color }}>
                          {task.priority}
                        </span>
                      </>
                    }
                  >
                    {(close) =>
                      PRIORITIES.map((p) => {
                        const meta = priorityMeta[p];
                        return (
                          <MenuItem
                            key={p}
                            active={p === task.priority}
                            onClick={() => {
                              ws.updateTask(task.id, { priority: p });
                              close();
                            }}
                          >
                            <Flag
                              className="size-3.5 shrink-0"
                              style={{ fill: meta.color, color: meta.color }}
                            />
                            <span className="flex-1 truncate">{p}</span>
                            <span className="font-mono text-[11px] text-ink-soft">
                              {meta.label}
                            </span>
                          </MenuItem>
                        );
                      })
                    }
                  </Dropdown>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                    style={{ color: pr.color }}
                  >
                    <Flag
                      className="size-3.5"
                      style={{ fill: pr.color, color: pr.color }}
                    />
                    {task.priority}
                  </span>
                )}
              </Detail>

              {/* Start date */}
              <Detail label="Start date">
                <span className="text-[13px] font-medium text-ink">
                  {detail.startDate}
                </span>
              </Detail>

              {/* Due date (end) */}
              <Detail label="Due date">
                <span className="text-[13px] font-medium text-ink">
                  {task.due}
                </span>
              </Detail>

              {/* Project */}
              <Detail label="Project">
                <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  <span
                    className="size-2.5 rounded-[3px]"
                    style={{ background: project?.color }}
                  />
                  {project?.name}
                </span>
              </Detail>

              {/* Labels */}
              <Detail label="Labels">
                <div className="flex flex-wrap gap-1.5">
                  {detail.labels.map((l) => (
                    <span
                      key={l}
                      className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-ink-muted"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </Detail>

              {/* Created */}
              <Detail label="Created">
                <span className="text-[13px] text-ink-muted">
                  {detail.created}
                </span>
              </Detail>
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-card py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="size-3.5" />
                Delete task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Section heading wrapper ---- */
function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[12px] font-bold tracking-wide text-ink-soft uppercase">
          {title}
        </h2>
        {meta && (
          <span className="tnum text-[12px] font-semibold text-ink-soft">
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ---- Details row ---- */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
      <span className="w-[68px] shrink-0 pt-1 text-[12px] font-semibold text-ink-soft">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ---- Assignee summary: avatar stack + names / count ---- */
function AssigneeSummary({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return <span className="text-[13px] text-ink-soft">Unassigned</span>;
  }
  const names = ids
    .map((id) => memberById(id)?.name)
    .filter((n): n is string => Boolean(n));
  const label = names.length <= 2 ? names.join(", ") : `${names.length} assignees`;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <AvatarStack ids={ids} size={24} />
      <span className="truncate text-[13px] font-medium text-ink">{label}</span>
    </span>
  );
}

/* ---- Click-to-open menu with click-away ---- */
function Dropdown({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink/30"
      >
        <span className="flex min-w-0 items-center gap-2">{trigger}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink-soft transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 z-[90] mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-popover p-1.5 shadow-float"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-secondary",
        active ? "bg-signal-soft text-signal" : "text-ink",
      )}
    >
      {children}
      {active && <Check className="ml-auto size-4 shrink-0 text-signal" />}
    </button>
  );
}
