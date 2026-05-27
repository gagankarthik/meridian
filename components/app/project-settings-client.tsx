"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Check,
  Crown,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { memberById, projectById } from "@/lib/app-data";
import { AvatarStack } from "@/components/app/widgets";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

const SWATCHES = [
  "#2563eb",
  "#3b82f6",
  "#1d9aaa",
  "#22a06b",
  "#e2a200",
  "#2f6df0",
  "#d9842b",
  "#e34935",
];

export function ProjectSettingsClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const router = useRouter();

  const project =
    ws.projects.find((p) => p.id === projectId) ?? projectById(projectId);

  const [name, setName] = useState(project?.name ?? "");
  const [key, setKey] = useState(project?.key ?? "");
  const [color, setColor] = useState(project?.color ?? SWATCHES[0]);
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(project?.startDate ?? "");
  const [endDate, setEndDate] = useState(project?.endDate ?? "");
  const [status, setStatus] = useState(project?.status ?? "On track");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canDelete = ws.can("delete");
  const canEdit = ws.can("edit");

  function save() {
    ws.updateProject(projectId, {
      name,
      key,
      color,
      description: description.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  }

  function deleteProject() {
    ws.deleteProject(projectId);
    router.push("/app");
  }

  if (!project) {
    return (
      <div className="max-w-[820px] p-5 sm:p-6 lg:p-8">
        <p className="rounded-2xl border border-line bg-card p-6 text-[14px] text-ink-muted shadow-card">
          This project no longer exists.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[820px] space-y-6 p-5 sm:p-6 lg:p-8">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
          {project.name}
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
          Settings
        </h1>
      </div>

      {/* General */}
      <section className="rounded-2xl border border-line bg-card shadow-card">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-[14px] font-bold tracking-tight text-ink">
              General
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-soft">
              Name, key, and accent color for this project.
            </p>
          </div>
        </header>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_180px]">
            <Field label="Project name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-signal/40"
              />
            </Field>
            <Field label="Key">
              <input
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                maxLength={6}
                className="tnum w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[14px] font-semibold uppercase tracking-wide text-ink outline-none transition-colors focus:border-signal/40"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project about? Shown under the project name."
              className="w-full resize-y rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40"
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Start date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors focus:border-signal/40"
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors focus:border-signal/40"
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 text-[13.5px] font-medium text-ink outline-none transition-colors focus:border-signal/40"
              >
                <option value="On track">On track</option>
                <option value="At risk">At risk</option>
                <option value="Off track">Off track</option>
              </select>
            </Field>
          </div>
          {startDate && endDate && endDate < startDate && (
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">
              End date is before the start date.
            </p>
          )}

          <Field label="Accent color">
            <div className="flex flex-wrap items-center gap-2.5">
              {SWATCHES.map((c) => {
                const on = c === color;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Set color ${c}`}
                    className={cn(
                      "grid size-8 place-items-center rounded-lg ring-2 transition-all",
                      on ? "ring-ink/60" : "ring-transparent hover:ring-line",
                    )}
                    style={{ background: c }}
                  >
                    {on && (
                      <Check className="size-4 text-white" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-line bg-paper-raised px-5 py-3.5">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
              Saved
            </span>
          )}
          <button
            onClick={save}
            disabled={!canEdit || (!!startDate && !!endDate && endDate < startDate)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-50"
            title={canEdit ? undefined : "Your role can't edit this project"}
          >
            Save changes
          </button>
        </footer>
      </section>

      {/* People */}
      <section className="rounded-2xl border border-line bg-card shadow-card">
        <header className="border-b border-line px-5 py-3.5">
          <h2 className="text-[14px] font-bold tracking-tight text-ink">
            People
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            Leads and reviewers for this project.
          </p>
        </header>

        <div className="divide-y divide-line">
          <PeopleRow
            icon={Crown}
            tint="text-[#e2a200]"
            label="Leads"
            ids={project.leadIds}
          />
          <PeopleRow
            icon={ShieldCheck}
            tint="text-[#1d9aaa]"
            label="Reviewers"
            ids={project.reviewerIds}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-500/40 bg-card shadow-card">
        <header className="border-b border-red-500/20 px-5 py-3.5">
          <h2 className="text-[14px] font-bold tracking-tight text-red-600 dark:text-red-400">
            Danger zone
          </h2>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            Irreversible and destructive actions.
          </p>
        </header>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-ink">
                Archive project
              </p>
              <p className="mt-0.5 text-[12px] text-ink-soft">
                Hide this project and freeze its tasks. You can restore it later.
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40">
              <Archive className="size-3.5" />
              Archive
            </button>
          </div>

          {canDelete && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div>
                <p className="text-[14px] font-semibold text-ink">
                  Delete project
                </p>
                <p className="mt-0.5 text-[12px] text-ink-soft">
                  Permanently remove this project and all of its data.
                </p>
              </div>
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-red-700"
              >
                <Trash2 className="size-3.5" />
                Delete project
              </button>
            </div>
          )}
        </div>
      </section>

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete}
          title="Delete project?"
          description={`This permanently removes ${project.name} and all of its tasks, files, and history. This action cannot be undone.`}
          confirmLabel="Delete project"
          danger
          onConfirm={deleteProject}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

function PeopleRow({
  icon: Icon,
  tint,
  label,
  ids,
}: {
  icon: typeof Crown;
  tint: string;
  label: string;
  ids: string[];
}) {
  const names = ids
    .map((id) => memberById(id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-2.5">
        <Icon className={cn("size-4", tint)} strokeWidth={1.8} />
        <div>
          <p className="text-[13px] font-semibold text-ink">{label}</p>
          <p className="text-[12px] text-ink-soft">
            {names || "None assigned"}
          </p>
        </div>
      </div>
      {ids.length > 0 && <AvatarStack ids={ids} size={28} />}
    </div>
  );
}
