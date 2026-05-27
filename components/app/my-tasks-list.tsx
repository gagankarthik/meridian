"use client";

import { Flag } from "lucide-react";
import {
  COLUMN_LABEL,
  ME_ID,
  getTaskDetail,
  priorityMeta,
  projectById,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { AvatarStack, ProgressBar, ProjectAvatar, StatusChip } from "@/components/app/widgets";

export function MyTasksList({ mode }: { mode: "assigned" | "created" }) {
  const ws = useWorkspace();
  const tasks = ws.tasks.filter((t) =>
    mode === "assigned"
      ? t.assigneeIds.includes(ME_ID) || t.assigneeId === ME_ID
      : getTaskDetail(t).reporterId === ME_ID,
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.column === "done").length;
  const inProgress = tasks.filter((t) => t.column === "in_progress").length;
  const dueSoon = tasks.filter((t) => t.column !== "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
        {total} task{total === 1 ? "" : "s"}
      </p>
      <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
        {mode === "assigned" ? "Assigned to me" : "Created by me"}
      </h1>

      {/* stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total" value={total} />
        <StatTile label="Completed" value={done} accent="#1f9d6b" />
        <StatTile label="In progress" value={inProgress} accent="#2f6df0" />
        <StatTile label="Due soon" value={dueSoon} accent="#d9842b" />
      </div>

      {/* progress */}
      <div className="mt-3 rounded-2xl border border-line bg-card p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-ink-soft">
            Overall progress
          </span>
          <span className="tnum text-[12px] font-semibold text-ink">
            {pct}% done
          </span>
        </div>
        <ProgressBar value={pct} />
        <p className="tnum mt-2 text-[11px] text-ink-soft">
          {done} of {total} complete
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        {tasks.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-ink-soft">
            Nothing here yet.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {tasks.map((t) => {
              const project = projectById(t.projectId);
              const pr = priorityMeta[t.priority];
              return (
                <button
                  key={t.id}
                  onClick={() => ws.openTask(t.id)}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-paper-raised sm:px-5"
                >
                  <ProjectAvatar
                    seed={project?.name ?? "project"}
                    size={28}
                    rounded="rounded-md"
                    className="hidden sm:inline-block"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">
                      {t.title}
                    </span>
                    <span className="text-[12px] text-ink-soft">{project?.name}</span>
                  </span>
                  <span className="hidden sm:block">
                    <StatusChip status={COLUMN_LABEL[t.column] ?? t.column} />
                  </span>
                  <span
                    className="hidden items-center gap-1.5 text-[12.5px] font-semibold sm:inline-flex"
                    style={{ color: pr.color }}
                  >
                    <Flag className="size-3.5" style={{ fill: pr.color, color: pr.color }} />
                    {t.priority}
                  </span>
                  <AvatarStack ids={t.assigneeIds} size={24} />
                  <span className="tnum hidden w-28 text-right text-[12px] text-ink-soft md:block">
                    {t.due}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <span className="text-[12px] font-semibold text-ink-soft">{label}</span>
      <p
        className={
          "tnum mt-3 font-display text-[1.75rem] leading-none font-extrabold tracking-tight" +
          (accent ? "" : " text-ink")
        }
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
