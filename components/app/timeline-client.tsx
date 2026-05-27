"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  COLUMN_LABEL,
  getTaskDetail,
  projectById,
  type Task,
} from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  type GanttFeature,
} from "@/components/kibo-ui/gantt";

const STATUS_COLOR: Record<string, string> = {
  backlog: "#8b909c",
  todo: "#2563eb",
  in_progress: "#e2a200",
  review: "#7a3ff0",
  done: "#22a06b",
};
const COLUMN_ORDER = ["backlog", "todo", "in_progress", "review", "done"];

function toDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toFeature(t: Task): GanttFeature {
  const detail = getTaskDetail(t);
  const start = toDate(detail.startDate) ?? new Date();
  let end = toDate(t.due) ?? start;
  if (end < start) end = start;
  return {
    id: t.id,
    name: t.title,
    startAt: start,
    endAt: end,
    status: {
      id: t.column,
      name: COLUMN_LABEL[t.column] ?? t.column,
      color: STATUS_COLOR[t.column] ?? "#2563eb",
    },
  };
}

export function TimelineClient({ projectId }: { projectId: string }) {
  const ws = useWorkspace();
  const project = projectById(projectId);

  /* The gantt uses dnd-kit, whose generated aria-describedby ids differ
     between server and client. Render it only after mount to avoid a
     hydration mismatch. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* Group features by status column, in a stable workflow order. */
  const groups = useMemo(() => {
    const byCol = new Map<string, GanttFeature[]>();
    for (const t of ws.tasks) {
      if (t.projectId !== projectId) continue;
      const list = byCol.get(t.column) ?? [];
      list.push(toFeature(t));
      byCol.set(t.column, list);
    }
    return COLUMN_ORDER.filter((c) => byCol.has(c)).map((c) => ({
      column: c,
      name: COLUMN_LABEL[c] ?? c,
      items: byCol.get(c)!,
    }));
  }, [ws.tasks, projectId]);

  const total = groups.reduce((s, g) => s + g.items.length, 0);

  /* Dragging a bar reschedules its due (end) date. */
  const handleMove = (id: string, _startAt: Date, endAt: Date | null) => {
    if (endAt) ws.updateTask(id, { due: format(endAt, "MMM dd, yyyy") });
  };

  if (!mounted) {
    return (
      <div className="h-full p-4 sm:p-5">
        <div className="h-full animate-pulse rounded-2xl border border-line bg-paper-raised" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="grid h-full place-items-center p-10 text-center text-[13px] text-ink-soft">
        No scheduled work in {project?.name ?? "this project"} yet.
      </div>
    );
  }

  return (
    <div className="h-full p-4 sm:p-5">
      <GanttProvider
        range="monthly"
        className="h-full rounded-2xl border border-line shadow-card"
      >
        <GanttSidebar>
          {groups.map((g) => (
            <GanttSidebarGroup key={g.column} name={g.name}>
              {g.items.map((f) => (
                <GanttSidebarItem
                  key={f.id}
                  feature={f}
                  onSelectItem={(id) => ws.openTask(id)}
                />
              ))}
            </GanttSidebarGroup>
          ))}
        </GanttSidebar>
        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {groups.map((g) => (
              <GanttFeatureListGroup key={g.column}>
                {g.items.map((f) => (
                  <GanttFeatureItem key={f.id} {...f} onMove={handleMove}>
                    <button
                      type="button"
                      onClick={() => ws.openTask(f.id)}
                      className="flex h-full w-full items-center gap-1.5 truncate text-left"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: f.status.color }}
                      />
                      <span className="truncate text-[11px] font-medium text-foreground">
                        {f.name}
                      </span>
                    </button>
                  </GanttFeatureItem>
                ))}
              </GanttFeatureListGroup>
            ))}
          </GanttFeatureList>
          <GanttToday />
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}
