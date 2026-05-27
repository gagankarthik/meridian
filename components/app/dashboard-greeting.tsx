"use client";

import { useWorkspace } from "@/components/app/workspace";

/** Real, time-aware greeting using the signed-in user's name. */
export function DashboardGreeting() {
  const ws = useWorkspace();
  const first = (ws.me.name || "there").trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
        {date}
      </p>
      <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
        {part}, {first}.
      </h1>
    </div>
  );
}
