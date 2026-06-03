"use client";

import { Bug, Sparkles, SquareCheck, TrendingUp, Wrench } from "lucide-react";
import { ticketTypeMeta, type TicketType } from "@/lib/app-data";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Bug> = {
  Bug,
  Sparkles,
  SquareCheck,
  TrendingUp,
  Wrench,
};

/** The lucide icon for a ticket type, colored by its meta. */
export function TicketTypeIcon({
  type,
  className,
}: {
  type: TicketType;
  className?: string;
}) {
  const meta = ticketTypeMeta[type];
  const Icon = ICONS[meta.icon] ?? SquareCheck;
  return (
    <Icon
      className={cn("size-3.5", className)}
      style={{ color: meta.color }}
      strokeWidth={2}
    />
  );
}

/** Compact, tinted ticket-type chip (icon + label). */
export function TicketTypeBadge({
  type,
  className,
}: {
  type: TicketType;
  className?: string;
}) {
  const meta = ticketTypeMeta[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide",
        className,
      )}
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 13%, transparent)`,
      }}
    >
      <TicketTypeIcon type={type} className="size-3" />
      {type}
    </span>
  );
}
