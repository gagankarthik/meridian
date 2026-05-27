"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, ChevronDown, Flag, Lock, X } from "lucide-react";
import {
  memberById,
  priorityMeta,
  type Priority,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { Avatar } from "@/components/app/widgets";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

export function TaskCreate() {
  const ws = useWorkspace();
  const router = useRouter();

  const canCreate = ws.can("create");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(() => ws.projects[0]?.id ?? "");
  const [column, setColumn] = useState(() => {
    const todo = ws.columns.find((c) => c.id === "todo");
    return todo?.id ?? ws.columns[0]?.id ?? "";
  });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [startDate, setStartDate] = useState("");
  const [due, setDue] = useState("");
  const [tag, setTag] = useState("");

  if (!canCreate) {
    return (
      <div className="grid h-full place-items-center bg-paper p-6">
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
  const columnName =
    ws.columns.find((c) => c.id === column)?.name ?? "Select status";
  const pr = priorityMeta[priority];
  const reviewer = memberById(reviewerId);

  const toggleAssignee = (id: string) =>
    setAssigneeIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );

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
    });
    router.push(`/app/tasks/${created.id}`);
  };

  return (
    <div className="h-full overflow-y-auto bg-paper">
      <div className="mx-auto w-full max-w-[760px] px-6 py-6">
        {/* ---- Top bar ---- */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink-soft shadow-card transition-colors hover:border-signal/40 hover:text-ink"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="font-display text-[26px] leading-tight font-extrabold tracking-tight text-ink">
            New task
          </h1>
        </div>

        {/* ---- Form card ---- */}
        <div className="mt-6 rounded-2xl border border-line bg-card p-6 shadow-card">
          {/* Title */}
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="What needs to be done?"
              className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[15px] font-semibold text-ink outline-none transition-colors placeholder:font-normal placeholder:text-ink-soft focus:border-signal/40 focus:bg-card"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add more detail, context, or acceptance criteria…"
              className="w-full resize-y rounded-xl border border-line bg-paper-raised px-3.5 py-3 text-[14px] leading-relaxed text-ink-muted outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40 focus:bg-card"
            />
          </Field>

          {/* Project + Status */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Project">
              <Dropdown
                trigger={
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ background: project?.color ?? "#2563eb" }}
                    />
                    {project?.name ?? "Select project"}
                  </span>
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
                      {p.name}
                    </MenuItem>
                  ))
                }
              </Dropdown>
            </Field>

            <Field label="Status">
              <Dropdown
                trigger={
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                    <span className="size-1.5 rounded-full bg-ink-soft" />
                    {columnName}
                  </span>
                }
              >
                {(close) =>
                  ws.columns.map((c) => (
                    <MenuItem
                      key={c.id}
                      active={c.id === column}
                      onClick={() => {
                        setColumn(c.id);
                        close();
                      }}
                    >
                      <span className="size-1.5 rounded-full bg-ink-soft" />
                      {c.name}
                    </MenuItem>
                  ))
                }
              </Dropdown>
            </Field>
          </div>

          {/* Assignees */}
          <Field label="Assignees">
            <Dropdown
              trigger={
                assigneeIds.length === 0 ? (
                  <span className="text-[13.5px] text-ink-soft">
                    Add assignees
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {assigneeIds.map((id) => {
                      const m = memberById(id);
                      if (!m) return null;
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1.5 rounded-full bg-secondary py-0.5 pr-2 pl-0.5 text-[12px] font-semibold text-ink"
                        >
                          <Avatar
                            initials={m.initials}
                            hue={m.hue}
                            seed={m.initials}
                            src={m.avatar}
                            size={18}
                          />
                          {m.name.split(" ")[0]}
                          <span
                            role="button"
                            tabIndex={-1}
                            aria-label={`Remove ${m.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssignee(id);
                            }}
                            className="grid size-4 place-items-center rounded-full text-ink-soft transition-colors hover:bg-line hover:text-red-600"
                          >
                            <X className="size-3" />
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )
              }
            >
              {() =>
                ws.members.map((m) => (
                  <MenuItem
                    key={m.id}
                    active={assigneeIds.includes(m.id)}
                    onClick={() => toggleAssignee(m.id)}
                  >
                    <Avatar initials={m.initials} hue={m.hue} seed={m.initials} src={m.avatar} size={20} />
                    {m.name}
                  </MenuItem>
                ))
              }
            </Dropdown>
          </Field>

          {/* Reviewer (single-select) */}
          <Field label="Reviewer">
            <Dropdown
              trigger={
                reviewer ? (
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                    <Avatar initials={reviewer.initials} hue={reviewer.hue} seed={reviewer.initials} src={reviewer.avatar} size={20} />
                    {reviewer.name}
                  </span>
                ) : (
                  <span className="text-[13.5px] text-ink-soft">
                    Add a reviewer
                  </span>
                )
              }
            >
              {(close) => (
                <>
                  <MenuItem
                    active={!reviewerId}
                    onClick={() => {
                      setReviewerId("");
                      close();
                    }}
                  >
                    <span className="size-5 shrink-0 rounded-full bg-secondary" />
                    No reviewer
                  </MenuItem>
                  {ws.members.map((m) => (
                    <MenuItem
                      key={m.id}
                      active={m.id === reviewerId}
                      onClick={() => {
                        setReviewerId(m.id);
                        close();
                      }}
                    >
                      <Avatar initials={m.initials} hue={m.hue} seed={m.initials} src={m.avatar} size={20} />
                      {m.name}
                    </MenuItem>
                  ))}
                </>
              )}
            </Dropdown>
          </Field>

          {/* Priority + Start date */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Priority">
              <Dropdown
                trigger={
                  <span
                    className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold"
                    style={{ color: pr.color }}
                  >
                    <Flag
                      className="size-3.5"
                      style={{ fill: pr.color, color: pr.color }}
                    />
                    {priority}
                  </span>
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
                        <Flag
                          className="size-3.5"
                          style={{ fill: meta.color, color: meta.color }}
                        />
                        <span className="flex-1">{p}</span>
                        <span className="font-mono text-[11px] text-ink-soft">
                          {meta.label}
                        </span>
                      </MenuItem>
                    );
                  })
                }
              </Dropdown>
            </Field>

            <Field label="Start date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors focus:border-signal/40 focus:bg-card"
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors focus:border-signal/40 focus:bg-card"
              />
            </Field>
          </div>

          {/* Tag */}
          <Field label="Tag">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Design, Platform, Growth"
              className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40 focus:bg-card"
            />
          </Field>
        </div>

        {/* ---- Footer ---- */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
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
            className="rounded-xl bg-signal px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Labeled field wrapper ---- */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="mb-1.5 block text-[12px] font-bold tracking-wide text-ink-soft uppercase">
        {label}
      </label>
      {children}
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
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl border border-line bg-paper-raised px-3.5 py-2 text-left transition-colors hover:border-line-strong focus:border-signal/40"
      >
        {trigger}
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-ink-soft transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-card p-1 shadow-float"
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
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-paper-raised",
        active && "bg-signal-soft text-signal",
      )}
    >
      {children}
      {active && <Check className="ml-auto size-3.5 shrink-0 text-signal" />}
    </button>
  );
}
