import { cn } from "@/lib/utils";

/* ============================================================
   MERIDIAN — colorful inline SVG product illustrations.
   Self-contained, no external assets. Each accepts className.
   Palette: blue #2563eb · blue-400 #3b82f6 · teal #1d9aaa
            green #22a06b · yellow #e2a200 · blue #2f6df0
            orange #d9842b · coral #e34935
   ============================================================ */

type IllustrationProps = {
  className?: string;
};

/* ---- Decorative gradient blobs (soft background atmosphere) ---- */

export function BlobA({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      <defs>
        <radialGradient id="blobA-grad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#2f6df0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1d9aaa" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <path
        fill="url(#blobA-grad)"
        d="M171 36c41 6 84 22 102 58s12 87-9 124-66 56-110 56-92-13-115-50-22-86 1-126S130 30 171 36Z"
      />
    </svg>
  );
}

export function BlobB({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      <defs>
        <radialGradient id="blobB-grad" cx="65%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#e2a200" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#d9842b" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#e34935" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <path
        fill="url(#blobB-grad)"
        d="M168 28c44-3 92 9 116 44s19 89 2 130-58 64-104 66-95-12-122-49-29-87-9-129S124 31 168 28Z"
      />
    </svg>
  );
}

/* ---- Board: stylized kanban columns with colored cards ---- */

export function BoardIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
      className={cn("select-none", className)}
    >
      <defs>
        <linearGradient id="board-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef0ff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="16" fill="url(#board-bg)" />
      {/* column 1 — blue */}
      <rect x="16" y="20" width="64" height="14" rx="7" fill="#2563eb" opacity="0.18" />
      <rect x="16" y="42" width="64" height="32" rx="8" fill="#ffffff" />
      <rect x="24" y="50" width="34" height="6" rx="3" fill="#2563eb" />
      <rect x="24" y="60" width="48" height="5" rx="2.5" fill="#c7c2f3" />
      <rect x="16" y="82" width="64" height="32" rx="8" fill="#ffffff" />
      <rect x="24" y="90" width="28" height="6" rx="3" fill="#2f6df0" />
      <rect x="24" y="100" width="48" height="5" rx="2.5" fill="#bcd0fb" />
      {/* column 2 — teal */}
      <rect x="88" y="20" width="64" height="14" rx="7" fill="#1d9aaa" opacity="0.2" />
      <rect x="88" y="42" width="64" height="32" rx="8" fill="#ffffff" />
      <rect x="96" y="50" width="38" height="6" rx="3" fill="#1d9aaa" />
      <rect x="96" y="60" width="44" height="5" rx="2.5" fill="#b3e2e8" />
      {/* column 3 — green */}
      <rect x="160" y="20" width="64" height="14" rx="7" fill="#22a06b" opacity="0.2" />
      <rect x="160" y="42" width="64" height="32" rx="8" fill="#ffffff" />
      <rect x="168" y="50" width="32" height="6" rx="3" fill="#22a06b" />
      <rect x="168" y="60" width="48" height="5" rx="2.5" fill="#b6e6d2" />
      <rect x="160" y="82" width="64" height="32" rx="8" fill="#ffffff" />
      <rect x="168" y="90" width="40" height="6" rx="3" fill="#e2a200" />
      <rect x="168" y="100" width="44" height="5" rx="2.5" fill="#f4dfa6" />
      {/* card shadows via subtle strokes */}
      <rect x="16" y="42" width="64" height="32" rx="8" stroke="#e3e3f5" />
      <rect x="88" y="42" width="64" height="32" rx="8" stroke="#cdeaee" />
      <rect x="160" y="42" width="64" height="32" rx="8" stroke="#cdeedd" />
    </svg>
  );
}

/* ---- Timeline: colorful gantt bars on a calendar grid ---- */

export function TimelineIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
      className={cn("select-none", className)}
    >
      <defs>
        <linearGradient id="tl-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9f6ee" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="tl-bar1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#2f6df0" />
        </linearGradient>
        <linearGradient id="tl-bar2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1d9aaa" />
          <stop offset="100%" stopColor="#22a06b" />
        </linearGradient>
        <linearGradient id="tl-bar3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2a200" />
          <stop offset="100%" stopColor="#d9842b" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="16" fill="url(#tl-bg)" />
      {/* grid lines */}
      {[60, 108, 156, 204].map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="140" stroke="#dde8e1" strokeWidth="1" />
      ))}
      {/* month labels */}
      <rect x="20" y="22" width="22" height="5" rx="2.5" fill="#9fb8a9" />
      <rect x="68" y="22" width="22" height="5" rx="2.5" fill="#9fb8a9" />
      <rect x="116" y="22" width="22" height="5" rx="2.5" fill="#9fb8a9" />
      <rect x="164" y="22" width="22" height="5" rx="2.5" fill="#9fb8a9" />
      {/* gantt bars */}
      <rect x="20" y="44" width="92" height="16" rx="8" fill="url(#tl-bar1)" />
      <rect x="60" y="70" width="120" height="16" rx="8" fill="url(#tl-bar2)" />
      <rect x="96" y="96" width="80" height="16" rx="8" fill="url(#tl-bar3)" />
      <rect x="44" y="122" width="100" height="16" rx="8" fill="#e34935" opacity="0.9" />
      {/* milestone dots */}
      <circle cx="112" cy="52" r="4" fill="#ffffff" />
      <circle cx="180" cy="78" r="4" fill="#ffffff" />
      {/* today marker */}
      <line x1="132" y1="20" x2="132" y2="140" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="132" cy="20" r="3.5" fill="#2563eb" />
    </svg>
  );
}

/* ---- Automation: connected nodes / branching flow ---- */

export function AutomationIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
      className={cn("select-none", className)}
    >
      <defs>
        <linearGradient id="au-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3eefc" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="16" fill="url(#au-bg)" />
      {/* connectors */}
      <path d="M60 80 C 100 80, 100 44, 150 44" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
      <path d="M60 80 C 100 80, 100 80, 150 80" stroke="#1d9aaa" strokeWidth="2.5" fill="none" />
      <path d="M60 80 C 100 80, 100 116, 150 116" stroke="#d9842b" strokeWidth="2.5" fill="none" />
      {/* trigger node */}
      <circle cx="48" cy="80" r="22" fill="#2563eb" />
      <path d="M44 72 l10 8 -10 8 z" fill="#ffffff" />
      {/* action nodes */}
      <rect x="150" y="32" width="64" height="24" rx="12" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="164" cy="44" r="5" fill="#3b82f6" />
      <rect x="176" y="41" width="28" height="6" rx="3" fill="#d3cbef" />
      <rect x="150" y="68" width="64" height="24" rx="12" fill="#ffffff" stroke="#1d9aaa" strokeWidth="1.5" />
      <circle cx="164" cy="80" r="5" fill="#1d9aaa" />
      <rect x="176" y="77" width="28" height="6" rx="3" fill="#b9e2e7" />
      <rect x="150" y="104" width="64" height="24" rx="12" fill="#ffffff" stroke="#d9842b" strokeWidth="1.5" />
      <circle cx="164" cy="116" r="5" fill="#d9842b" />
      <rect x="176" y="113" width="28" height="6" rx="3" fill="#f1d6b6" />
    </svg>
  );
}

/* ---- Reporting: bar + donut analytics ---- */

export function ReportingIllustration({ className }: IllustrationProps) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const segs = [
    { value: 52, color: "#2563eb" },
    { value: 28, color: "#22a06b" },
    { value: 20, color: "#e2a200" },
  ];
  let offset = 0;
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
      className={cn("select-none", className)}
    >
      <defs>
        <linearGradient id="rp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff5e6" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="rp-bar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2f6df0" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" rx="16" fill="url(#rp-bg)" />
      {/* bars */}
      {[
        [28, 70, "#e2a200"],
        [52, 52, "#d9842b"],
        [40, 64, "url(#rp-bar)"],
        [64, 40, "#22a06b"],
        [80, 24, "#1d9aaa"],
      ].map(([h, y, fill], i) => (
        <rect
          key={i}
          x={24 + i * 22}
          y={y as number}
          width="14"
          height={h as number}
          rx="5"
          fill={fill as string}
        />
      ))}
      <line x1="20" y1="116" x2="140" y2="116" stroke="#ead9b8" strokeWidth="1.5" />
      {/* donut */}
      <g transform="translate(186 72) rotate(-90)">
        <circle cx="0" cy="0" r={r} fill="none" stroke="#f0e6d2" strokeWidth="12" />
        {segs.map((s, i) => {
          const len = (s.value / 100) * c;
          const el = (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </g>
      <circle cx="186" cy="72" r="11" fill="#ffffff" />
    </svg>
  );
}

/* ---- Stacked avatars (small decorative team cluster) ---- */

export function AvatarsIllustration({ className }: IllustrationProps) {
  const people = [
    { x: 18, fill: "#2563eb" },
    { x: 40, fill: "#1d9aaa" },
    { x: 62, fill: "#e2a200" },
    { x: 84, fill: "#e34935" },
  ];
  return (
    <svg
      viewBox="0 0 124 44"
      fill="none"
      aria-hidden="true"
      className={cn("select-none", className)}
    >
      {people.map((p, i) => (
        <g key={i}>
          <circle cx={p.x + 12} cy="22" r="16" fill="#ffffff" />
          <circle cx={p.x + 12} cy="22" r="13" fill={p.fill} />
          <circle cx={p.x + 12} cy="17" r="5" fill="#ffffff" opacity="0.92" />
          <path
            d={`M${p.x + 2} 33 a10 9 0 0 1 20 0 z`}
            fill="#ffffff"
            opacity="0.92"
          />
        </g>
      ))}
    </svg>
  );
}
