"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Flag,
  Lock,
  Paperclip,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  eligibleMembersFor,
  memberById,
  priorityMeta,
  type Member,
  type Priority,
  type SubTask,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { Avatar } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskCreate() {
  const ws = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Context from wherever "new task" was launched: a project page passes
  // ?project=…; a board/table column's "+" also passes &status=… so both the
  // project and the column come in pre-fixed. Read reactively (route stays
  // mounted across query changes).
  const projectParam = searchParams.get("project");
  const statusParam = searchParams.get("status");
  const lockedProject = Boolean(projectParam);
  const lockedStatus = Boolean(statusParam);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [column, setColumn] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [startDate, setStartDate] = useState("");
  const [due, setDue] = useState("");
  const [tag, setTag] = useState("");
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSub, setNewSub] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // You can create a task only where you're Owner/Admin/Member. Before a
  // project resolves from the URL, allow it if ANY accessible project qualifies
  // (avoids a flash of the "no permission" screen on first paint).
  const canCreate = projectId
    ? ws.canInProject(projectId, "create")
    : ws.projects.some((p) => ws.canInProject(p.id, "create"));

  // Owners/admins may backdate tasks; members are limited to today onward.
  const myRole = ws.myProjectRole(projectId);
  const canBackdate = myRole === "Owner" || myRole === "Admin";
  const today = new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
  const startMin = canBackdate ? undefined : today;
  const dueMin = canBackdate ? startDate || undefined : startDate || today;

  const columns = ws.columnsForProject(projectId);
  // Strictly project-confined: ONLY members on this project's team can be an
  // assignee or reviewer — never anyone outside it (not even yourself unless
  // you're on the project). A project is a confined space.
  const eligibleMembers = eligibleMembersFor(projectId, ws.projects, ws.members);

  // Project: fixed from the URL, else default to the first one the user can
  // actually create in (skip projects where they're only a viewer).
  useEffect(() => {
    if (projectParam) {
      setProjectId(projectParam);
      return;
    }
    const firstCreatable =
      ws.projects.find((p) => ws.canInProject(p.id, "create")) ?? ws.projects[0];
    if (firstCreatable) setProjectId((cur) => cur || firstCreatable.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectParam, ws.projects]);

  // Status: fixed from the URL, else default to "To do" (or the first column).
  useEffect(() => {
    const cols = ws.columnsForProject(projectId);
    if (statusParam) {
      setColumn(statusParam);
      return;
    }
    setColumn((cur) =>
      cur && cols.some((c) => c.id === cur)
        ? cur
        : cols.find((c) => c.id === "todo")?.id ?? cols[0]?.id ?? "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam, projectId, ws.columns, ws.projects]);

  // Drop selected people who aren't eligible for the chosen project.
  useEffect(() => {
    const ok = new Set(
      eligibleMembersFor(projectId, ws.projects, ws.members).map((m) => m.id),
    );
    setAssigneeIds((cur) => cur.filter((id) => ok.has(id)));
    setReviewerId((cur) => (ok.has(cur) ? cur : ""));
  }, [projectId, ws.projects, ws.members]);

  if (!canCreate) {
    return (
      <div className="grid h-full place-items-center bg-sunken p-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-card p-8 text-center shadow-card">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-ink-soft">
            <Lock className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-[20px] font-extrabold tracking-tight text-ink">
            You don&apos;t have permission
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
            Your role can&apos;t create tasks. Ask a workspace admin to grant
            access.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-[13px] font-semibold text-ink-muted transition-colors hover:border-signal/40 hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const project = ws.projects.find((p) => p.id === projectId);
  const columnName = columns.find((c) => c.id === column)?.name ?? "Select status";
  const pr = priorityMeta[priority];
  const reviewer = memberById(reviewerId);

  const toggleAssignee = (id: string) =>
    setAssigneeIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setSubtasks((l) => [...l, { id: `st-${Date.now()}-${l.length}`, title: t, done: false }]);
    setNewSub("");
  };
  const removeSub = (id: string) => setSubtasks((l) => l.filter((s) => s.id !== id));
  const toggleSub = (id: string) =>
    setSubtasks((l) => l.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (list.length) setFiles((f) => [...f, ...list]);
    e.target.value = "";
  };
  const removeFile = (i: number) => setFiles((f) => f.filter((_, idx) => idx !== i));

  const create = () => {
    if (!title.trim()) return;
    const created = ws.addTask({
      title: title.trim(),
      column,
      projectId,
      assigneeIds,
      assigneeId: assigneeIds[0],
      priority,
      due: due.trim() || undefined,
      startDate: startDate.trim() || undefined,
      reviewerId: reviewerId || undefined,
      tag: tag.trim() || undefined,
      tagColor: project?.color ?? "#2563eb",
      description: description.trim() || undefined,
      subtasks: subtasks.length ? subtasks : undefined,
    });
    if (files.length) void ws.uploadTaskDocuments(created.id, projectId, files);
    router.push(`/app/tasks/${created.id}`);
  };

  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="h-full overflow-y-auto bg-sunken">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-soft">
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 transition-colors hover:text-ink"
          >
            Projects
          </button>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate text-ink-muted">{project?.name ?? "Project"}</span>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="shrink-0 font-semibold text-ink">New task</span>
        </nav>

        {/* ---- Header card ---- */}
        <div className="mb-5 rounded-2xl border border-line bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            {/* Project (Fixed pill when locked, else dropdown) */}
            {lockedProject ? (
              <FixedPill color={project?.color}>
                {project?.name ?? "This project"}
              </FixedPill>
            ) : (
              <Dropdown
                trigger={
                  <>
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ background: project?.color ?? "#2563eb" }}
                    />
                    <span>{project?.name ?? "Select project"}</span>
                  </>
                }
              >
                {(close) =>
                  ws.projects.map((p) => (
                    <MenuItem
                      key={p.id}
                      active={p.id === projectId}
                      onClick={() => {
                        setProjectId(p.id);
                        close();
                      }}
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ background: p.color }}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                    </MenuItem>
                  ))
                }
              </Dropdown>
            )}

            {/* Status (Fixed pill when locked, else dropdown) */}
            {lockedStatus ? (
              <FixedPill>{columnName}</FixedPill>
            ) : (
              <Dropdown
                trigger={
                  <>
                    <span className="size-1.5 rounded-full bg-ink-soft" />
                    <span>{columnName}</span>
                  </>
                }
              >
                {(close) =>
                  columns.map((c) => (
                    <MenuItem
                      key={c.id}
                      active={c.id === column}
                      onClick={() => {
                        setColumn(c.id);
                        close();
                      }}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          c.id === column ? "bg-signal" : "bg-ink-soft",
                        )}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                    </MenuItem>
                  ))
                }
              </Dropdown>
            )}

            {/* Priority (editable pill) */}
            <Dropdown
              trigger={
                <>
                  <Flag className="size-3.5" style={{ fill: pr.color, color: pr.color }} />
                  <span style={{ color: pr.color }}>{priority}</span>
                </>
              }
            >
              {(close) =>
                PRIORITIES.map((p) => {
                  const meta = priorityMeta[p];
                  return (
                    <MenuItem
                      key={p}
                      active={p === priority}
                      onClick={() => {
                        setPriority(p);
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
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="What needs to be done?"
            className="-mx-2 mt-4 w-[calc(100%+1rem)] rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-[clamp(1.6rem,3vw,2rem)] leading-tight font-extrabold tracking-tight text-ink outline-none transition-colors placeholder:font-normal placeholder:text-ink-soft hover:bg-paper-raised focus:border-signal/40 focus:bg-card"
          />
        </div>

        {/* ---- 7 / 5 layout ---- */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* MAIN */}
          <div className="min-w-0 space-y-5 lg:col-span-7">
            {/* Description */}
            <Section title="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Add detail, context, or acceptance criteria…"
                className="w-full resize-y rounded-xl border border-line bg-paper-raised px-4 py-3.5 text-[14px] leading-relaxed text-ink-muted outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40 focus:bg-card"
              />
            </Section>

            {/* Sub-tasks */}
            <Section
              title="Sub-tasks"
              meta={subtasks.length ? `${doneCount}/${subtasks.length}` : undefined}
            >
              {subtasks.length === 0 && (
                <p className="mb-1 text-[13px] text-ink-soft">
                  No sub-tasks yet — add one below.
                </p>
              )}
              <div className="space-y-0.5">
                {subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-paper-raised"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSub(s.id)}
                      aria-label={s.done ? "Mark incomplete" : "Mark complete"}
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors",
                        s.done
                          ? "border-signal bg-signal text-white"
                          : "border-line-strong hover:border-signal",
                      )}
                    >
                      {s.done && <Check className="size-3" strokeWidth={3} />}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-[14px] text-ink",
                        s.done && "text-ink-soft line-through",
                      )}
                    >
                      {s.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSub(s.id)}
                      aria-label="Remove sub-task"
                      className="grid size-6 shrink-0 place-items-center rounded-md text-ink-soft opacity-0 transition-all group-hover:opacity-100 hover:bg-secondary hover:text-red-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-paper-raised px-2.5 py-2 focus-within:border-signal/40">
                <Plus className="size-3.5 shrink-0 text-ink-soft" />
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())}
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
            </Section>

            {/* Documents */}
            <Section title="Documents" meta={files.length ? `${files.length}` : undefined}>
              {files.length === 0 && (
                <p className="text-[13px] text-ink-soft">
                  No documents yet — attach files below.
                </p>
              )}
              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2 shadow-card"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {f.name}
                        </p>
                        <p className="text-[11px] text-ink-soft">{fileSize(f.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label={`Remove ${f.name}`}
                        className="grid size-7 shrink-0 place-items-center rounded-md text-ink-soft transition-colors hover:bg-secondary hover:text-red-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                multiple
                onChange={onPickFiles}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-paper-raised px-3 py-3 text-[13px] font-semibold text-ink-muted transition-colors hover:border-signal/50 hover:text-ink"
              >
                <Paperclip className="size-4" />
                Attach files
              </button>
            </Section>
          </div>

          {/* RIGHT HALF — details + actions */}
          <aside className="space-y-5 lg:col-span-5">
            {/* Details */}
            <div className="rounded-2xl border border-line bg-card px-5 py-3 shadow-card">
              {/* Assignees */}
              <Detail label="Assignees">
                <Dropdown
                  trigger={
                    assigneeIds.length === 0 ? (
                      <span className="text-[13px] text-ink-soft">Add assignees</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {assigneeIds.map((id) => {
                          const m = memberById(id);
                          if (!m) return null;
                          return (
                            <span
                              key={id}
                              className="flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-2 pl-0.5 text-[12px] font-semibold text-ink"
                            >
                              <Avatar
                                initials={m.initials}
                                hue={m.hue}
                                seed={m.initials}
                                src={m.avatar}
                                size={18}
                              />
                              {m.name.split(" ")[0]}
                            </span>
                          );
                        })}
                      </div>
                    )
                  }
                >
                  {() => (
                    <MemberSearchList
                      members={eligibleMembers}
                      selectedIds={assigneeIds}
                      onToggle={toggleAssignee}
                    />
                  )}
                </Dropdown>
              </Detail>

              {/* Reviewer */}
              <Detail label="Reviewer">
                <Dropdown
                  trigger={
                    reviewer ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <Avatar
                          initials={reviewer.initials}
                          hue={reviewer.hue}
                          seed={reviewer.initials}
                          src={reviewer.avatar}
                          size={22}
                        />
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
                        setReviewerId("");
                        close();
                      }}
                      onToggle={(id) => {
                        setReviewerId(id);
                        close();
                      }}
                    />
                  )}
                </Dropdown>
              </Detail>

              {/* Start date */}
              <Detail label="Start date">
                <input
                  type="date"
                  value={startDate}
                  min={startMin}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-signal/40 focus:bg-card"
                />
              </Detail>

              {/* Due date */}
              <Detail label="Due date">
                <input
                  type="date"
                  value={due}
                  min={dueMin}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-signal/40 focus:bg-card"
                />
              </Detail>
              {!canBackdate && (
                <p className="-mt-1 text-[11px] text-ink-soft">
                  Members can schedule from today onward. Ask an admin to
                  backdate.
                </p>
              )}

              {/* Tag */}
              <Detail label="Tag">
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Design, Platform"
                  className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40 focus:bg-card"
                />
              </Detail>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-line bg-card px-4 py-2.5 text-[13px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={create}
                disabled={!title.trim()}
                className="rounded-xl bg-signal px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create task
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
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
            <Avatar initials={m.initials} hue={m.hue} seed={m.initials} src={m.avatar} size={22} />
            <span className="flex-1 truncate">{m.name}</span>
          </MenuItem>
        ))
      )}
    </div>
  );
}

/* ---- Fixed (locked) value pill ---- */
function FixedPill({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[12.5px] font-bold text-ink">
      {color && <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />}
      <span className="truncate">{children}</span>
      <span className="ml-1 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-soft">
        Fixed
      </span>
    </span>
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
          <span className="tnum text-[12px] font-semibold text-ink-soft">{meta}</span>
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
            className="absolute top-full left-0 z-[90] mt-1 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-xl border border-line bg-popover p-1.5 shadow-float"
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
