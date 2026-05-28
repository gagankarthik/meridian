"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Flag,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { authedFetch } from "@/lib/api-client";
import {
  COLUMN_LABEL,
  eligibleMembersFor,
  getTaskDetail,
  memberById,
  priorityMeta,
  projectById,
  relativeTime,
  subtaskKey,
  taskKey,
  type Comment,
  type Member,
  type Priority,
  type SubTask,
  type Task,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { AvatarStack, MemberAvatar, ProgressBar } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

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
  const [comments, setComments] = useState<Comment[]>(() =>
    detail.comments.map((c) => ({ ...c })),
  );
  const [draft, setDraft] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(() =>
    task.assigneeIds.length ? [...task.assigneeIds] : [task.assigneeId],
  );
  const [reviewerId, setReviewerId] = useState(() => detail.reviewerId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const reporter = memberById(detail.reporterId);
  const reviewer = memberById(reviewerId);
  const project = projectById(task.projectId);
  const pr = priorityMeta[task.priority];
  // Strictly project-confined: ONLY members on this project's team can be an
  // assignee or reviewer — never anyone outside it. A project is a confined space.
  const eligibleMembers = eligibleMembersFor(task.projectId, ws.projects, ws.members);

  const setReviewer = (id: string) => {
    setReviewerId(id);
    ws.updateTask(task.id, { reviewerId: id });
  };

  const doneCount = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length
    ? Math.round((doneCount / subtasks.length) * 100)
    : 0;

  const commitTitle = () => {
    const next = title.trim();
    if (next && next !== task.title) ws.updateTask(task.id, { title: next });
    else if (!next) setTitle(task.title);
  };

  const commitDescription = () => {
    if (description !== (task.description ?? "")) {
      ws.updateTask(task.id, { description });
    }
  };

  // Subtask edits persist immediately (optimistic + API via updateTask).
  const saveSubtasks = (next: SubTask[]) => {
    setSubtasks(next);
    ws.updateTask(task.id, { subtasks: next });
  };
  const toggleSub = (id: string) =>
    saveSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );
  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    saveSubtasks([
      ...subtasks,
      { id: `st-${Date.now()}`, title: t, done: false },
    ]);
    setNewSub("");
  };
  const removeSub = (id: string) =>
    saveSubtasks(subtasks.filter((s) => s.id !== id));

  const sendComment = () => {
    const t = draft.trim();
    if (!t) return;
    const next: Comment[] = [
      ...comments,
      { id: `c-${Date.now()}`, authorId: ws.me.id, text: t, at: Date.now() },
    ];
    setComments(next);
    ws.updateTask(task.id, { comments: next });
    setDraft("");
  };

  // Documents attached to this task.
  const docs = ws.attachments.filter((a) => a.taskId === task.id);
  const docInputRef = useRef<HTMLInputElement>(null);
  const onPickDocs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (list.length) void ws.uploadTaskDocuments(task.id, task.projectId, list);
    e.target.value = "";
  };
  const viewDocument = async (objectKey: string) => {
    try {
      const res = await authedFetch(
        `/api/attachments?key=${encodeURIComponent(objectKey)}`,
      );
      if (!res.ok) return;
      const { url } = await res.json();
      if (url) window.open(url, "_blank", "noopener");
    } catch {
      /* ignore */
    }
  };

  const toggleAssignee = (id: string) => {
    const has = assigneeIds.includes(id);
    let next = has ? assigneeIds.filter((x) => x !== id) : [...assigneeIds, id];
    if (next.length === 0) next = [task.assigneeId];
    setAssigneeIds(next);
    // Persist OUTSIDE any state updater (calling another store's setState inside
    // a useState updater triggers "update while rendering" in React).
    ws.updateTask(task.id, {
      assigneeIds: next,
      assigneeId: next[0] ?? task.assigneeId,
    });
  };

  const onDelete = () => setConfirmOpen(true);
  const confirmDelete = () => {
    ws.deleteTask(task.id);
    router.push(`/app/board?project=${task.projectId}`);
  };

  return (
    <>
    <div className="h-full overflow-y-auto bg-sunken">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-soft">
          <button
            type="button"
            onClick={() => router.push(`/app/board?project=${task.projectId}`)}
            className="shrink-0 transition-colors hover:text-ink"
          >
            Projects
          </button>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate text-ink-muted">{project?.name}</span>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="shrink-0 font-semibold text-ink">{taskKey(task)}</span>
        </nav>

        {/* ---- Header card ---- */}
        <div className="mb-5 rounded-2xl border border-line bg-card p-5 shadow-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status (editable pill) */}
              {canEdit ? (
                <Dropdown
                  trigger={
                    <>
                      <span className="size-1.5 rounded-full" style={{ background: task.tagColor }} />
                      <span>{COLUMN_LABEL[task.column] ?? task.column}</span>
                    </>
                  }
                >
                  {(close) =>
                    ws.columnsForProject(task.projectId).map((col) => (
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
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[12.5px] font-bold text-ink">
                  <span className="size-1.5 rounded-full" style={{ background: task.tagColor }} />
                  {COLUMN_LABEL[task.column] ?? task.column}
                </span>
              )}

              {/* Priority (editable pill) */}
              {canEdit ? (
                <Dropdown
                  trigger={
                    <>
                      <Flag className="size-3.5" style={{ fill: pr.color, color: pr.color }} />
                      <span style={{ color: pr.color }}>{task.priority}</span>
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
                          <Flag className="size-3.5" style={{ fill: meta.color, color: meta.color }} />
                          <span className="flex-1 truncate">{p}</span>
                          <span className="font-mono text-[11px] text-ink-soft">{meta.label}</span>
                        </MenuItem>
                      );
                    })
                  }
                </Dropdown>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: pr.color }}>
                  <Flag className="size-3.5" style={{ fill: pr.color, color: pr.color }} />
                  {task.priority}
                </span>
              )}

              <span className="mx-0.5 h-4 w-px bg-line" />
              <span className="text-[12.5px] text-ink-soft">
                {task.due && task.due !== "—" ? `Due ${task.due}` : "No due date"}
              </span>
            </div>

            {canDelete && (
              <div className="relative self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setActionsOpen((v) => !v)}
                  aria-label="Task actions"
                  aria-expanded={actionsOpen}
                  className="grid size-9 place-items-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {actionsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-popover p-1 shadow-float">
                      <button
                        type="button"
                        onClick={() => {
                          setActionsOpen(false);
                          onDelete();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-300"
                      >
                        <Trash2 className="size-3.5" />
                        Delete task
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

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
              className="-mx-2 mt-4 w-[calc(100%+1rem)] rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-[clamp(1.6rem,3vw,2rem)] leading-tight font-extrabold tracking-tight text-ink outline-none transition-colors hover:bg-paper-raised focus:border-signal/40 focus:bg-card"
            />
          ) : (
            <h1 className="mt-4 font-display text-[clamp(1.6rem,3vw,2rem)] leading-tight font-extrabold tracking-tight text-ink">
              {title}
            </h1>
          )}
        </div>

        {/* ---- 8 / 4 layout ---- */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* MAIN */}
          <div className="min-w-0 space-y-5 lg:col-span-7">
            {/* Description */}
            <Section title="Description">
              {canEdit ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={commitDescription}
                  rows={6}
                  placeholder="Add a description…"
                  className="w-full resize-y rounded-xl border border-line bg-paper-raised px-4 py-3.5 text-[14px] leading-relaxed text-ink-muted outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40 focus:bg-card"
                />
              ) : description ? (
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-ink-muted">
                  {description}
                </p>
              ) : (
                <p className="text-[14px] text-ink-soft">No description yet.</p>
              )}
            </Section>

            {/* Sub-tasks */}
            <Section title="Sub-tasks" meta={`${doneCount}/${subtasks.length}`}>
              {subtasks.length > 0 && (
                <div className="mb-3">
                  <ProgressBar value={pct} />
                </div>
              )}
              {subtasks.length === 0 && (
                <p className="mb-1 text-[13px] text-ink-soft">
                  No sub-tasks yet{canEdit ? " — add one below." : "."}
                </p>
              )}
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

            {/* Documents */}
            <Section title="Documents" meta={docs.length ? `${docs.length}` : undefined}>
              {docs.length === 0 ? (
                <p className="text-[13px] text-ink-soft">
                  No documents yet{canEdit ? " — attach files below." : "."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2 shadow-card"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {d.name}
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          {[d.size, d.date].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {d.objectKey && (
                        <button
                          type="button"
                          onClick={() => viewDocument(d.objectKey!)}
                          aria-label={`Open ${d.name}`}
                          className="grid size-7 shrink-0 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-ink"
                        >
                          <Download className="size-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => ws.removeAttachment(d.id)}
                          aria-label={`Delete ${d.name}`}
                          className="grid size-7 shrink-0 place-items-center rounded-md text-ink-soft transition-colors hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {canEdit && (
                <>
                  <input
                    ref={docInputRef}
                    type="file"
                    multiple
                    onChange={onPickDocs}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-paper-raised px-3 py-3 text-[13px] font-semibold text-ink-muted transition-colors hover:border-signal/50 hover:text-ink"
                  >
                    <Paperclip className="size-4" />
                    Attach files
                  </button>
                </>
              )}
            </Section>

          </div>

          {/* RIGHT HALF — comments + details */}
          <aside className="space-y-5 lg:col-span-5">
          

            {/* Details */}
            <div className="rounded-2xl border border-line bg-card px-5 py-3 shadow-card">
              {/* Assignee (multi-select) */}
              <Detail label="Assignee">
                {canAssign ? (
                  <Dropdown trigger={<AssigneeSummary ids={assigneeIds} />}>
                    {() => (
                      <MemberSearchList
                        members={eligibleMembers}
                        selectedIds={assigneeIds}
                        onToggle={toggleAssignee}
                      />
                    )}
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

              {/* Reviewer */}
              <Detail label="Reviewer">
                {canAssign ? (
                  <Dropdown
                    trigger={
                      reviewer ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <MemberAvatar member={reviewer} size={22} />
                          <span className="truncate text-[13px] font-medium text-ink">
                            {reviewer.name}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[13px] text-ink-soft">Add a reviewer</span>
                      )
                    }
                  >
                    {(close) => (
                      <MemberSearchList
                        members={eligibleMembers}
                        selectedIds={reviewerId ? [reviewerId] : []}
                        single
                        onClear={() => {
                          setReviewer("");
                          close();
                        }}
                        onToggle={(id) => {
                          setReviewer(id);
                          close();
                        }}
                      />
                    )}
                  </Dropdown>
                ) : reviewer ? (
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
            </div>

              {/* Comments */}
            <Section title="Comments" meta={`${comments.length}`}>
              {comments.length === 0 ? (
                <p className="text-[13px] text-ink-soft">
                  No comments yet. Start the conversation below.
                </p>
              ) : (
                <div className="space-y-5">
                  {comments.map((c) => {
                    const m = memberById(c.authorId);
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
                              {relativeTime(c.at)}
                            </span>
                          </div>
                          <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap text-ink-muted">
                            {c.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {canEdit && (
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
              )}
            </Section>
          </aside>
        </div>
      </div>
    </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this task?"
        body={`“${task.title}” and its sub-tasks and comments will be permanently removed. This can’t be undone.`}
        confirmLabel="Delete task"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

/* ---- Confirm dialog (used for destructive actions) ---- */
function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
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
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[400px] rounded-2xl border border-line bg-card p-6 shadow-float"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-red-500/10 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <h2
              id="confirm-title"
              className="mt-4 font-display text-[18px] font-extrabold tracking-tight text-ink"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              {body}
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
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---- Searchable people picker (assignees / reviewer) ---- */
function MemberSearchList({
  members,
  selectedIds,
  onToggle,
  single,
  onClear,
}: {
  members: Member[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  single?: boolean;
  onClear?: () => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = members.filter((m) => m.name.toLowerCase().includes(query));
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-1.5 -mt-1.5 mb-1 border-b border-line bg-popover p-1.5">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-paper-raised px-2.5 py-1.5 focus-within:border-signal/40">
          <Search className="size-3.5 shrink-0 text-ink-soft" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-soft"
          />
        </div>
      </div>
      {single && onClear && (
        <MenuItem active={selectedIds.length === 0} onClick={onClear}>
          <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-secondary text-ink-soft">
            <X className="size-3" />
          </span>
          <span className="flex-1">No reviewer</span>
        </MenuItem>
      )}
      {filtered.length === 0 ? (
        <p className="px-2.5 py-3 text-center text-[12.5px] text-ink-soft">
          No people found.
        </p>
      ) : (
        filtered.map((m) => (
          <MenuItem key={m.id} active={selectedIds.includes(m.id)} onClick={() => onToggle(m.id)}>
            <MemberAvatar member={m} size={22} />
            <span className="flex-1 truncate">{m.name}</span>
          </MenuItem>
        ))
      )}
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
    <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-bold tracking-tight text-ink">
          {title}
        </h2>
        {meta && (
          <span className="tnum text-[12px] font-semibold text-ink-soft">
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
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
