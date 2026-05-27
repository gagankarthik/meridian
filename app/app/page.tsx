import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardCharts } from "@/components/app/dashboard-charts";
import { CalendarMenu } from "@/components/app/calendar-sheet";

export default function DashboardPage() {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            {date}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
            Good morning, Dana.
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/app/tasks/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-signal px-3.5 py-2.5 text-[13px] font-bold text-white shadow-card transition-colors hover:bg-signal-strong"
          >
            <Plus className="size-4" strokeWidth={2.2} />
            Add task
          </Link>
          <CalendarMenu />
        </div>
      </div>

      <DashboardCharts />
    </div>
  );
}
