"use client";

import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  FileText,
  FolderOpen,
  Layers,
  MessageSquare,
  Plug,
  Upload,
  Video,
} from "lucide-react";
import { Reveal, RevealItem, Section, Stagger } from "./primitives";

type Row = { icon: LucideIcon; tint: string; name: string; sub: string };

/* flat tinted-square glyph */
function Glyph({ icon: Icon, tint, size = 32 }: { icon: LucideIcon; tint: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${tint} 13%, transparent)`,
        color: tint,
      }}
    >
      <Icon size={Math.round(size * 0.52)} strokeWidth={2.1} />
    </span>
  );
}

/* ---- mockup 1: stacked work sources ---- */
const SOURCES: Row[] = [
  { icon: FolderOpen, tint: "#2563eb", name: "Documents", sub: "12 files synced" },
  { icon: Cloud, tint: "#06b6d4", name: "Cloud storage", sub: "8 files synced" },
  { icon: FileText, tint: "#7a3ff0", name: "Wiki & notes", sub: "Create and update pages" },
];

function OrganizedMock() {
  return (
    <div className="space-y-2">
      {SOURCES.map((r, i) => (
        <div
          key={r.name}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5 shadow-card"
          style={{ marginLeft: `${i * 10}px` }}
        >
          <Glyph icon={r.icon} tint={r.tint} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[10.5px] text-ink-soft">{r.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- mockup 2: connected tools with a manage action ---- */
const TOOLS: Row[] = [
  { icon: MessageSquare, tint: "#22a06b", name: "Team chat", sub: "Real-time messages" },
  { icon: Video, tint: "#e23d6f", name: "Recordings", sub: "Async video updates" },
];

function IntegrationsMock() {
  return (
    <div className="space-y-2.5">
      {TOOLS.map((r) => (
        <div
          key={r.name}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5 shadow-card"
        >
          <Glyph icon={r.icon} tint={r.tint} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[10.5px] text-ink-soft">{r.sub}</p>
          </div>
          <span className="rounded-md bg-ink px-2.5 py-1 text-[10.5px] font-bold text-paper">
            Manage
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---- mockup 3: document upload with progress ---- */
function UploadMock() {
  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-3 shadow-card">
      <div className="flex items-center gap-2.5">
        <Glyph icon={FileText} tint="#e2483d" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold text-ink">
            brand-guidelines.pdf
          </p>
          <p className="text-[10.5px] text-ink-soft">0.4 MB of 0.8 MB</p>
        </div>
        <span className="text-[11px] font-bold text-signal">50%</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <span className="block h-full w-1/2 rounded-full bg-signal" />
      </div>
    </div>
  );
}

const CARDS = [
  {
    icon: Layers,
    tint: "#2563eb",
    title: "Perfectly organized",
    desc: "Pull every file and source into one place so your team always works from the latest version.",
    mock: <OrganizedMock />,
  },
  {
    icon: Plug,
    tint: "#22a06b",
    title: "Connected tools",
    desc: "Bring the tools you already use into the workflow — updates flow in and out without copy-paste.",
    mock: <IntegrationsMock />,
  },
  {
    icon: Upload,
    tint: "#e2a200",
    title: "Upload documents",
    desc: "Attach specs, briefs, and assets right to a task, so the context lives where the work happens.",
    mock: <UploadMock />,
  },
];

export function UseCases() {
  return (
    <Section id="use-cases" className="py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[clamp(2rem,4.2vw,2.9rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
          Plan projects and track
          <br className="hidden sm:block" /> tasks effortlessly
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
          Simplify task management with tools that help you plan, prioritize,
          and collaborate so your team gets more done every day.
        </p>
      </Reveal>

      <Stagger className="mt-14 grid gap-5 md:grid-cols-3" stagger={0.1}>
        {CARDS.map((c) => (
          <RevealItem
            key={c.title}
            className="group flex flex-col rounded-2xl border border-line bg-card p-5 shadow-card transition-[box-shadow,border-color] duration-300 hover:border-ink/15 hover:shadow-float"
          >
            <div className="rounded-xl border border-line bg-paper-raised p-4">
              {c.mock}
            </div>
            <div className="mt-5 flex items-center gap-2.5">
              <Glyph icon={c.icon} tint={c.tint} size={38} />
              <h3 className="text-[16px] font-bold tracking-tight text-ink">
                {c.title}
              </h3>
            </div>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted text-pretty">
              {c.desc}
            </p>
          </RevealItem>
        ))}
      </Stagger>
    </Section>
  );
}
