"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Inbox,
  PenLine,
  PenTool,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  eligibleMembersFor,
  memberById,
  projectById,
  projectMemberIds,
  relativeTime,
  type DocFile,
  type DocStatus,
  type Member,
} from "@/lib/app-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { MemberAvatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { authedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/* File-type visual meta (mirrors the Attachments tab). */
const EXT: Record<string, { color: string; icon: LucideIcon }> = {
  pdf: { color: "#e34935", icon: FileText },
  fig: { color: "#3b82f6", icon: PenTool },
  png: { color: "#1d9aaa", icon: ImageIcon },
  jpg: { color: "#1d9aaa", icon: ImageIcon },
  jpeg: { color: "#1d9aaa", icon: ImageIcon },
  xlsx: { color: "#22a06b", icon: FileSpreadsheet },
  csv: { color: "#22a06b", icon: FileSpreadsheet },
  doc: { color: "#2f6df0", icon: FileText },
  docx: { color: "#2f6df0", icon: FileText },
  mp4: { color: "#d9842b", icon: FileVideo },
};
const extMeta = (ext: string) => EXT[ext] ?? { color: "#7a869a", icon: FileText };

type FilterId = "all" | "review" | DocStatus;
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "review", label: "To review" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Changes requested" },
  { id: "all", label: "All" },
];

const STATUS_META: Record<
  DocStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: "In review",
    className:
      "border-[#d9842b]/30 bg-[#d9842b]/10 text-[#b8690f] dark:text-[#e2a200]",
    icon: Clock,
  },
  approved: {
    label: "Signed off",
    className:
      "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Changes requested",
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    icon: AlertCircle,
  },
};

export function DocumentationClient() {
  const ws = useWorkspace();
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reviewFor, setReviewFor] = useState<DocFile | null>(null);
  const [removeFor, setRemoveFor] = useState<DocFile | null>(null);

  // The signed-in user's ids (Cognito sub + member-record id, which can differ).
  const myRecordId = ws.members.find(
    (m) => m.id === ws.me.id || m.userId === ws.me.id,
  )?.id;
  const myIds = useMemo(
    () => new Set([ws.me.id, myRecordId].filter(Boolean) as string[]),
    [ws.me.id, myRecordId],
  );

  const isUploader = (d: DocFile) => (d.uploadedById ? myIds.has(d.uploadedById) : false);
  // A document is reviewable by its assigned reviewer or any project owner/admin.
  const canReview = (d: DocFile) =>
    (d.reviewerId ? myIds.has(d.reviewerId) : false) ||
    ws.canInProject(d.projectId, "manage");
  const canDelete = (d: DocFile) =>
    isUploader(d) || ws.canInProject(d.projectId, "manage");

  // Projects the user may upload a document to (drives the upload picker).
  const uploadProjects = ws.projects.filter((p) => ws.canInProject(p.id, "create"));
  const canUpload = uploadProjects.length > 0;

  const docs = ws.documents;

  const counts = useMemo(() => {
    const c = { all: docs.length, review: 0, pending: 0, approved: 0, rejected: 0 };
    for (const d of docs) {
      c[d.status] += 1;
      if (d.status === "pending" && canReview(d)) c.review += 1;
    }
    return c;
    // canReview reads myIds + ws projects; recompute when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, myIds, ws.projects]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      docs.filter((d) => {
        if (filter === "review") {
          if (!(d.status === "pending" && canReview(d))) return false;
        } else if (filter !== "all" && d.status !== filter) {
          return false;
        }
        if (q && !(d.title.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)))
          return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docs, filter, q, myIds, ws.projects],
  );

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

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            Review &amp; sign-off
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            Documentation
          </h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] text-ink-muted">
            Upload a document, assign a reviewer to approve it with a digital
            sign-off, and share it with viewers — all tied to a project.
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
          >
            <Plus className="size-4" />
            Upload document
          </button>
        )}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="w-full rounded-xl border border-line bg-card py-2 pr-8 pl-8 text-[13px] text-ink placeholder:text-ink-soft focus:border-signal focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid size-4 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-card p-1">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold transition-colors",
                  active
                    ? "bg-signal-soft text-signal-strong"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "tnum text-[11px] font-bold",
                    active ? "text-signal-strong" : "text-ink-soft",
                  )}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* list */}
      {docs.length === 0 ? (
        <EmptyState
          title="No documents yet"
          body={
            canUpload
              ? "Upload a document and assign a reviewer to get a sign-off, or share it with viewers."
              : "Documents shared with you for review or viewing will appear here."
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nothing here"
          body="Try a different search or filter."
          icon={Search}
        />
      ) : (
        <div className="space-y-2.5">
          {visible.map((d) => (
            <DocRow
              key={d.id}
              doc={d}
              canReview={d.status === "pending" && canReview(d)}
              canDelete={canDelete(d)}
              canResubmit={d.status === "rejected" && isUploader(d)}
              onReview={() => setReviewFor(d)}
              onResubmit={() => ws.resubmitDocument(d.id)}
              onDownload={() => handleDownload(d.objectKey)}
              onDelete={() => setRemoveFor(d)}
            />
          ))}
        </div>
      )}

      {uploadOpen && (
        <UploadDialog
          projects={uploadProjects}
          onClose={() => setUploadOpen(false)}
          onSubmit={(input) => {
            void ws.uploadDocument(input);
            setUploadOpen(false);
          }}
        />
      )}

      {reviewFor && (
        <ReviewDialog
          doc={reviewFor}
          defaultSigner={ws.me.name}
          onClose={() => setReviewFor(null)}
          onDecide={(decision, opts) => {
            ws.reviewDocument(reviewFor.id, decision, opts);
            setReviewFor(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!removeFor}
        title="Delete document?"
        description={`"${removeFor?.title ?? "This document"}" and its file will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => removeFor && ws.removeDocument(removeFor.id)}
        onClose={() => setRemoveFor(null)}
      />
    </div>
  );
}

/* --------------------------------- row --------------------------------- */
function DocRow({
  doc,
  canReview,
  canDelete,
  canResubmit,
  onReview,
  onResubmit,
  onDownload,
  onDelete,
}: {
  doc: DocFile;
  canReview: boolean;
  canDelete: boolean;
  canResubmit: boolean;
  onReview: () => void;
  onResubmit: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const meta = extMeta(doc.ext);
  const Icon = meta.icon;
  const status = STATUS_META[doc.status];
  const StatusIcon = status.icon;
  const project = projectById(doc.projectId);
  const reviewer = doc.reviewerId ? memberById(doc.reviewerId) : undefined;
  const uploader = doc.uploadedById ? memberById(doc.uploadedById) : undefined;
  const signer = doc.reviewedById ? memberById(doc.reviewedById) : reviewer;
  const viewers = doc.viewerIds
    .map((id) => memberById(id))
    .filter((m): m is Member => Boolean(m));

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card transition-colors hover:border-line-strong">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl"
          style={{
            background: `color-mix(in srgb, ${meta.color} 12%, white)`,
            color: meta.color,
          }}
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </span>

        <button
          type="button"
          onClick={onDownload}
          disabled={!doc.objectKey}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
          title={doc.objectKey ? "Open document" : "Preview available once uploaded"}
        >
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-bold text-ink">
              {doc.title}
            </span>
            {project && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-paper-raised px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                <span
                  className="size-2 rounded-[3px]"
                  style={{ background: project.color }}
                />
                {project.name}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-ink-soft">
            {doc.name}
            {doc.size ? ` · ${doc.size}` : ""} ·{" "}
            {uploader ? `Uploaded by ${uploader.name}` : "Uploaded"} · {doc.date}
          </p>
        </button>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide",
            status.className,
          )}
        >
          <StatusIcon className="size-3" />
          {status.label}
        </span>

        {/* reviewer + viewers */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-soft">Reviewer</span>
            {reviewer ? (
              <span title={reviewer.name}>
                <MemberAvatar member={reviewer} size={24} />
              </span>
            ) : (
              <span className="text-[12px] text-ink-soft">—</span>
            )}
          </div>
          {viewers.length > 0 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="text-[11px] font-semibold text-ink-soft">Viewers</span>
              <span className="flex -space-x-1.5">
                {viewers.slice(0, 3).map((m) => (
                  <span key={m.id} className="rounded-full ring-2 ring-card" title={m.name}>
                    <MemberAvatar member={m} size={24} />
                  </span>
                ))}
                {viewers.length > 3 && (
                  <span className="grid size-6 place-items-center rounded-full bg-secondary text-[10px] font-bold text-ink-muted ring-2 ring-card">
                    +{viewers.length - 3}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex shrink-0 items-center gap-2">
          {canReview && (
            <button
              type="button"
              onClick={onReview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-2.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-signal-strong"
            >
              <PenLine className="size-3.5" />
              Review
            </button>
          )}
          {canResubmit && (
            <button
              type="button"
              onClick={onResubmit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-signal/40 hover:text-signal"
            >
              <RotateCcw className="size-3.5" />
              Re-submit
            </button>
          )}
          <button
            type="button"
            title="Download"
            disabled={!doc.objectKey}
            onClick={onDownload}
            className="grid size-8 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-secondary hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="size-4" />
          </button>
          {canDelete && (
            <button
              type="button"
              title="Delete"
              onClick={onDelete}
              className="grid size-8 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-red-500/10 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* sign-off certificate / rejection reason */}
      {doc.status === "approved" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-600/20 bg-emerald-500/5 px-3 py-2 text-[12.5px] text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="size-4 shrink-0" />
          <span>
            Digitally signed off
            {doc.signature ? (
              <>
                {" "}
                by <span className="font-semibold">{doc.signature}</span>
              </>
            ) : signer ? (
              <>
                {" "}
                by <span className="font-semibold">{signer.name}</span>
              </>
            ) : null}
            {doc.reviewedAt ? ` · ${relativeTime(doc.reviewedAt)}` : ""}
          </span>
        </div>
      )}
      {doc.status === "rejected" && doc.rejectReason && (
        <p className="mt-3 rounded-lg bg-paper-raised px-3 py-2 text-[12.5px] text-ink-muted">
          <span className="font-semibold text-ink">Changes requested:</span>{" "}
          {doc.rejectReason}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ upload dialog ------------------------------ */
function UploadDialog({
  projects,
  onClose,
  onSubmit,
}: {
  projects: { id: string; name: string; color: string }[];
  onClose: () => void;
  onSubmit: (input: {
    file: File;
    title: string;
    projectId: string;
    reviewerId: string;
    viewerIds: string[];
    description?: string;
  }) => void;
}) {
  const ws = useWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [reviewerId, setReviewerId] = useState("");
  const [viewerIds, setViewerIds] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState("");

  // People eligible to review (project owner/admin/member, active only).
  const reviewerOptions = useMemo(
    () => eligibleMembersFor(projectId, ws.projects, ws.members),
    [projectId, ws.projects, ws.members],
  );
  // People who can be added as read-only viewers: anyone on the project.
  const viewerOptions = useMemo(
    () =>
      projectMemberIds(projectId)
        .map((id) => memberById(id))
        .filter((m): m is Member => Boolean(m) && m!.status === "active"),
    [projectId],
  );

  // Reset reviewer/viewers whenever the project changes.
  useEffect(() => {
    setReviewerId("");
    setViewerIds(new Set());
  }, [projectId]);

  function pick(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  function toggleViewer(id: string) {
    setViewerIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const valid = Boolean(file && projectId && reviewerId);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="font-display text-lg font-bold tracking-tight">
            Upload document
          </DialogTitle>
          <DialogDescription>
            Attach a file to a project, choose who reviews it, and add any
            viewers who just need to see it.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* file */}
          <div>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => {
                pick(e.target.files);
                e.target.value = "";
              }}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-paper-raised p-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in srgb, ${extMeta((file.name.split(".").pop() ?? "").toLowerCase()).color} 12%, white)`,
                    color: extMeta((file.name.split(".").pop() ?? "").toLowerCase()).color,
                  }}
                >
                  <FileText className="size-5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="shrink-0 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-signal/40"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-paper-raised px-6 py-8 text-center transition-colors hover:border-signal/60 hover:bg-signal-soft/30"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-signal-soft text-signal">
                  <Upload className="size-5" />
                </span>
                <span className="text-[13.5px] font-bold text-ink">
                  Choose a file to upload
                </span>
                <span className="text-[12px] text-ink-soft">
                  PDF, Word, images and more
                </span>
              </button>
            )}
          </div>

          {/* title */}
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Launch Plan"
              className={inputClass}
            />
          </Field>

          {/* project */}
          <Field label="Project">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={inputClass}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          {/* reviewer */}
          <Field
            label="Reviewer"
            hint="They approve with a digital sign-off or request changes."
          >
            <select
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a reviewer…</option>
              {reviewerOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {reviewerOptions.length === 0 && (
              <p className="mt-1.5 text-[11.5px] text-ink-soft">
                No eligible reviewers on this project yet — add members on the
                project team first.
              </p>
            )}
          </Field>

          {/* viewers */}
          <Field
            label="Viewers"
            hint="Read-only access. They can view & download, but not review."
          >
            {viewerOptions.filter((m) => m.id !== reviewerId).length === 0 ? (
              <p className="text-[12.5px] text-ink-soft">
                No other project members to add as viewers.
              </p>
            ) : (
              <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-xl border border-line bg-paper-raised p-1.5">
                {viewerOptions
                  .filter((m) => m.id !== reviewerId)
                  .map((m) => {
                    const on = viewerIds.has(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleViewer(m.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-card"
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors",
                            on ? "border-signal bg-signal text-white" : "border-line",
                          )}
                        >
                          {on && <CheckCircle2 className="size-3.5" />}
                        </span>
                        <MemberAvatar member={m} size={24} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </Field>

          {/* description */}
          <Field label="Note (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add context for the reviewer…"
              className={cn(inputClass, "resize-y")}
            />
          </Field>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 rounded-b-2xl border-t border-line bg-paper-raised px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink/40"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              file &&
              onSubmit({
                file,
                title,
                projectId,
                reviewerId,
                viewerIds: Array.from(viewerIds),
                description: description.trim() || undefined,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Upload className="size-3.5" />
            Send for review
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ review dialog ------------------------------ */
function ReviewDialog({
  doc,
  defaultSigner,
  onClose,
  onDecide,
}: {
  doc: DocFile;
  defaultSigner: string;
  onClose: () => void;
  onDecide: (
    decision: "approved" | "rejected",
    opts?: { signature?: string; reason?: string },
  ) => void;
}) {
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [signature, setSignature] = useState("");
  const [reason, setReason] = useState("");
  const uploader = doc.uploadedById ? memberById(doc.uploadedById) : undefined;

  const approveValid = signature.trim().length > 1;
  const rejectValid = reason.trim().length > 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold tracking-tight">
            Review document
          </DialogTitle>
          <DialogDescription>
            {doc.title}
            {uploader ? ` · from ${uploader.name}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* mode switch */}
        <div className="flex gap-1 rounded-xl border border-line bg-paper-raised p-1">
          {(["approve", "reject"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition-colors",
                mode === m
                  ? m === "approve"
                    ? "bg-emerald-600 text-white"
                    : "bg-red-600 text-white"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {m === "approve" ? "Approve & sign off" : "Request changes"}
            </button>
          ))}
        </div>

        {mode === "approve" ? (
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Type your full name to digitally sign off on this document. Your
              name and the date will be recorded as your approval.
            </p>
            <div className="relative">
              <PenLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
              <input
                autoFocus
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={defaultSigner || "Your full name"}
                className={cn(inputClass, "pl-9 font-medium")}
                style={{ fontFamily: "var(--font-display, inherit)" }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Send this back to {uploader?.name ?? "the uploader"} with a reason
              so they know what to change.
            </p>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What needs to change?"
              className={cn(inputClass, "resize-y")}
            />
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            Cancel
          </button>
          {mode === "approve" ? (
            <button
              type="button"
              disabled={!approveValid}
              onClick={() => onDecide("approved", { signature: signature.trim() })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShieldCheck className="size-3.5" />
              Sign off
            </button>
          ) : (
            <button
              type="button"
              disabled={!rejectValid}
              onClick={() => onDecide("rejected", { reason: reason.trim() })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AlertCircle className="size-3.5" />
              Request changes
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- helpers -------------------------------- */
const inputClass =
  "w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal focus:ring-2 focus:ring-signal-soft";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11.5px] text-ink-soft">{hint}</p>}
    </div>
  );
}

function EmptyState({
  title,
  body,
  icon: Icon = Inbox,
}: {
  title: string;
  body: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-card py-16 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-secondary text-ink-soft">
        <Icon className="size-5" />
      </span>
      <p className="text-[15px] font-bold text-ink">{title}</p>
      <p className="max-w-sm text-[13px] text-ink-soft">{body}</p>
    </div>
  );
}
