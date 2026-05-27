import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardCharts } from "@/components/app/dashboard-charts";
import { DashboardGreeting } from "@/components/app/dashboard-greeting";
import { CalendarMenu } from "@/components/app/calendar-sheet";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-5 sm:p-6 lg:p-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardGreeting />
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
