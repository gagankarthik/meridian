import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { memberById } from "@/lib/app-data";
import { personAvatar, projectAvatar } from "@/lib/avatars";
import { cn } from "@/lib/utils";

/* Profile avatars use DiceBear "lorelei" illustrations, seeded stably so a
   person looks the same on every page. An uploaded photo (`src`) wins. */
export function Avatar({
  initials,
  hue,
  size = 28,
  className,
  seed,
  src,
}: {
  initials: string;
  hue: string;
  size?: number;
  className?: string;
  /** Stable seed for the generated avatar; defaults to the initials. */
  seed?: string;
  /** Uploaded photo URL — takes precedence over the generated avatar. */
  src?: string;
}) {
  const url = src ?? personAvatar(seed ?? initials);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={initials}
      width={size}
      height={size}
      className={cn(
        "inline-block shrink-0 rounded-full object-cover ring-1 ring-line ring-inset",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${hue} 18%, white)`,
      }}
    />
  );
}

/* The one true avatar for a member — an uploaded photo if they have one, else
   a generated avatar seeded by their stable id, so the same person looks
   identical everywhere in the app. */
export function MemberAvatar({
  member,
  size = 28,
  className,
}: {
  member: {
    id: string;
    name: string;
    initials: string;
    hue: string;
    avatar?: string;
  };
  size?: number;
  className?: string;
}) {
  return (
    <Avatar
      initials={member.initials}
      hue={member.hue}
      seed={member.initials}
      src={member.avatar}
      size={size}
      className={className}
    />
  );
}

/* Project icons use DiceBear "shapes" — a generated geometric mark per
   project, seeded stably so it's the same everywhere. */
export function ProjectAvatar({
  seed,
  size = 28,
  rounded = "rounded-lg",
  className,
}: {
  seed: string;
  size?: number;
  rounded?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={projectAvatar(seed || "project")}
      alt=""
      width={size}
      height={size}
      className={cn("inline-block shrink-0 object-cover", rounded, className)}
      style={{ width: size, height: size }}
    />
  );
}

export function AvatarStack({
  ids,
  size = 24,
  max = 3,
}: {
  ids: string[];
  size?: number;
  max?: number;
}) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <span className="flex -space-x-1.5">
      {shown.map((id) => {
        const m = memberById(id);
        if (!m) return null;
        return (
          <span key={id} className="rounded-full ring-2 ring-card" title={m.name}>
            <MemberAvatar member={m} size={size} />
          </span>
        );
      })}
      {extra > 0 && (
        <span
          className="grid place-items-center rounded-full bg-secondary font-bold text-ink-muted ring-2 ring-card"
          style={{ width: size, height: size, fontSize: size * 0.34 }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  "On track":
    "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  "At risk":
    "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  "Off track":
    "border-red-600/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300",
  active:
    "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  invited: "border-line bg-secondary text-ink-muted",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        STATUS_STYLES[status] ?? "border-line bg-secondary text-ink-muted",
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-soft">
          {label}
        </span>
        <Icon className="size-4 text-ink-soft" strokeWidth={1.6} />
      </div>
      <p className="tnum mt-3 font-display text-[2rem] leading-none font-extrabold tracking-tight text-ink">
        {value}
      </p>
      <p
        className={cn(
          "tnum mt-2 inline-flex items-center gap-1 font-mono text-[11px]",
          positive
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-red-700 dark:text-red-300",
        )}
      >
        {positive ? (
          <ArrowUpRight className="size-3" />
        ) : (
          <ArrowDownRight className="size-3" />
        )}
        {delta}
      </p>
    </div>
  );
}

export function ProgressBar({
  value,
  color = "var(--signal)",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-card shadow-card", className)}>
      <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-[13px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
