"use client";

import { useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Image as ImageIcon,
  PenTool,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { authedFetch } from "@/lib/api-client";
import { memberById } from "@/lib/app-data";
import { Avatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";

const EXT: Record<string, { color: string; icon: LucideIcon }> = {
  pdf: { color: "#e34935", icon: FileText },
  fig: { color: "#3b82f6", icon: PenTool },
  png: { color: "#1d9aaa", icon: ImageIcon },
  xlsx: { color: "#22a06b", icon: FileSpreadsheet },
  doc: { color: "#2f6df0", icon: FileText },
  mp4: { color: "#d9842b", icon: FileVideo },
};

export function AttachmentsClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const canCreate = ws.canInProject(projectId, "create");
  const canDelete = ws.canInProject(projectId, "delete");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Live view over the shared workspace attachments — re-renders whenever an
  // upload or delete (from here OR a task's Documents) changes `ws.attachments`.
  const files = ws.attachments.filter((f) => f.projectId === projectId);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    void ws.uploadProjectDocuments(projectId, Array.from(list));
  }

  function handleDelete(id: string) {
    ws.removeAttachment(id);
  }

  async function handleDownload(objectKey?: string) {
    if (!objectKey) return;
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
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? files.filter((f) => f.name.toLowerCase().includes(q))
    : files;

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* dropzone */}
      {canCreate && (
        <>
          <button
            type="button"
            onClick={openPicker}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-card/60 px-6 py-10 text-center transition-colors hover:border-signal/60 hover:bg-signal-soft/30"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-signal-soft text-signal">
              <Upload className="size-5" />
            </span>
            <p className="mt-1 text-[15px] font-bold text-ink">
              Drag &amp; drop files, or <span className="text-signal">browse</span>
            </p>
            <p className="max-w-md text-[12.5px] text-ink-soft">
              Stored in Amazon S3 with per-project access control. Up to 5 GB per
              file.
            </p>
          </button>

          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </>
      )}

      {/* search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files"
            className="w-full rounded-lg border border-line bg-card py-2 pr-3 pl-9 text-[13px] text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none"
          />
        </div>
        <span className="tnum shrink-0 text-[12px] text-ink-soft">
          {visible.length} {visible.length === 1 ? "file" : "files"}
        </span>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((f) => {
            const meta = EXT[f.ext] ?? { color: "#7a869a", icon: FileText };
            const who = memberById(f.uploadedById);
            const Icon = meta.icon;
            return (
              <div
                key={f.id}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-raised"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl"
                  style={{
                    background: `color-mix(in srgb, ${meta.color} 12%, white)`,
                    color: meta.color,
                  }}
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">
                    {f.name}
                    {f.ext ? `.${f.ext}` : ""}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">
                    {f.ext && (
                      <>
                        <span className="font-mono uppercase">{f.ext}</span> ·{" "}
                      </>
                    )}
                    {f.size} · {f.date}
                  </p>
                </div>
                {who && (
                  <span title={`Uploaded by ${who.name}`}>
                    <Avatar initials={who.initials} hue={who.hue} size={24} />
                  </span>
                )}
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    title="Download"
                    disabled={!f.objectKey}
                    onClick={() => handleDownload(f.objectKey)}
                    className="grid size-8 place-items-center rounded-lg text-ink-soft opacity-100 transition-all hover:bg-secondary hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:disabled:opacity-40"
                  >
                    <Download className="size-4" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => handleDelete(f.id)}
                      className="grid size-8 place-items-center rounded-lg text-ink-soft opacity-100 transition-all hover:bg-red-500/10 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-10 text-center text-[13px] text-ink-soft">
          {q
            ? "No files match your search."
            : "No files uploaded to this project yet."}
        </p>
      )}
    </div>
  );
}
