"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, ProjectAvatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

/* The project's visual identity is its generated shape icon, so there's no
   color picker. We still derive a stable accent color from the name for the
   small dots/legends/chart bars that use one. */
const PALETTE = [
  "#2563eb",
  "#1d9aaa",
  "#22a06b",
  "#e2a200",
  "#7a3ff0",
  "#e34935",
  "#2f6df0",
  "#d9842b",
];
function colorFromSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function CreateProjectDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ws = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Set<string>>(new Set());

  const key =
    name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "PROJ";

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSet(n);
  }

  function reset() {
    setName("");
    setDescription("");
    setMembers(new Set());
  }

  function create() {
    if (!name.trim()) return;
    // You're the owner of any project you create — you don't add yourself.
    // Teammates start as members; refine roles afterwards on the Team page.
    ws.addProject({
      name,
      key,
      description: description.trim() || undefined,
      color: colorFromSeed(name.trim()),
      memberIds: [...members],
    });
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold tracking-tight">
            New project
          </DialogTitle>
          <DialogDescription>
            Name your project and optionally add teammates. You&apos;ll be its
            owner — set everyone&apos;s role afterwards on the Team page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
              Project name
            </label>
            <div className="flex items-center gap-2">
              <ProjectAvatar seed={name || key || "project"} size={36} rounded="rounded-lg" />
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="e.g. Q4 Growth Initiatives"
                className="w-full rounded-xl border border-line bg-paper-raised px-3 py-2.5 text-[14px] text-ink outline-none focus:border-signal/40"
              />
              <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[11px] font-bold text-ink-muted">
                {key}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this project about? (optional)"
              className="w-full resize-y rounded-xl border border-line bg-paper-raised px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal/40"
            />
          </div>

          <MemberPicker
            label="Members"
            selected={members}
            onToggle={(id) => toggle(members, setMembers, id)}
          />
        </div>

        <div className="-mx-4 -mb-4 flex justify-end gap-2 border-t border-line bg-paper-raised p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40"
          >
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!name.trim()}
            className="rounded-xl bg-signal px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create project
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberPicker({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const { members, me } = useWorkspace();
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-ink-soft">
        {label}
        <span className="tnum font-normal">{selected.size} selected</span>
      </label>
      <div className="flex flex-wrap gap-1.5">
        {members
          .filter(
            (m) =>
              m.status === "active" && m.id !== me.id && m.userId !== me.id,
          )
          .map((m) => {
          const on = selected.has(m.id);
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[12.5px] font-medium transition-colors",
                on
                  ? "border-signal bg-signal-soft text-signal"
                  : "border-line bg-card text-ink-muted hover:border-ink/30",
              )}
            >
              <Avatar initials={m.initials} hue={m.hue} seed={m.initials} src={m.avatar} size={20} />
              {m.name.split(" ")[0]}
              {on && <Check className="size-3.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
