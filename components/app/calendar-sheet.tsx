"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { projectById, type Task } from "@/lib/app-data";
import { useWorkspace } from "@/components/app/workspace";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* App reference "today" (2026-05-27). */
const TODAY = { year: 2026, month: 4, day: 27 };

type DueDate = { month: number; day: number; year: number };

/* Parse a due string like "Jul 14, 2026" → { month, day, year }. */
function parseDue(due: string): DueDate | null {
  const m = due.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return null;
  const month = MONTH_INDEX[m[1].toLowerCase()];
  if (month === undefined) return null;
  return { month, day: Number(m[2]), year: Number(m[3]) };
}

/* Absolute day index (days since year 0) so tasks sort/compare cleanly. */
function dueOrdinal(d: DueDate): number {
  return d.year * 372 + d.month * 31 + d.day;
}

const TODAY_ORDINAL = TODAY.year * 372 + TODAY.month * 31 + TODAY.day;

type CalCell = {
  day: number;
  inMonth: boolean;
  tasks: Task[];
  today: boolean;
  key: string;
};

/* --------------------- inline dashboard calendar card --------------------- */

export function DashboardCalendar() {
  const ws = useWorkspace();
  const [cursor, setCursor] = useState({ year: 2026, month: 6 }); // July 2026
  const [hovered, setHovered] = useState<string | null>(null);

  const dated = useMemo(
    () =>
      ws.tasks.flatMap((t) => {
        const d = parseDue(t.due);
        return d ? [{ task: t, date: d }] : [];
      }),
    [ws.tasks],
  );

  const tasksByDay = useMemo(() => {
    return dated.reduce<Record<number, Task[]>>((acc, { task, date }) => {
      if (date.year === cursor.year && date.month === cursor.month) {
        (acc[date.day] ??= []).push(task);
      }
      return acc;
    }, {});
  }, [dated, cursor.year, cursor.month]);

  const weeks = useMemo<CalCell[][]>(() => {
    const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const daysInPrev = new Date(cursor.year, cursor.month, 0).getDate();

    const cells: CalCell[] = Array.from({ length: 42 }, (_, idx) => {
      const offset = idx - firstWeekday;
      if (offset < 0) {
        const day = daysInPrev + offset + 1;
        return { day, inMonth: false, tasks: [], today: false, key: `prev-${day}` };
      }
      if (offset >= daysInMonth) {
        const day = offset - daysInMonth + 1;
        return { day, inMonth: false, tasks: [], today: false, key: `next-${day}` };
      }
      const day = offset + 1;
      return {
        day,
        inMonth: true,
        tasks: tasksByDay[day] ?? [],
        today:
          TODAY.year === cursor.year &&
          TODAY.month === cursor.month &&
          TODAY.day === day,
        key: `cur-${day}`,
      };
    });

    return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [cursor.year, cursor.month, tasksByDay]);

  const dueCount = useMemo(
    () => Object.values(tasksByDay).reduce((s, list) => s + list.length, 0),
    [tasksByDay],
  );

  const upcoming = useMemo(
    () =>
      dated
        .filter(({ date }) => dueOrdinal(date) >= TODAY_ORDINAL)
        .sort((a, b) => dueOrdinal(a.date) - dueOrdinal(b.date))
        .slice(0, 6)
        .map((x) => x.task),
    [dated],
  );

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const total = c.year * 12 + c.month + delta;
      return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
    });
  }

  return (
    <section className="rounded-2xl border border-line bg-card shadow-card">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal">
            <CalendarDays className="size-4" strokeWidth={1.8} />
          </span>
          <h2 className="font-display text-[15px] font-bold tracking-tight text-ink">
            Calendar
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="tnum text-[13px] font-semibold text-ink">
            {MONTH_NAMES[cursor.month]} {cursor.year}
          </span>
          <span className="hidden font-mono text-[10px] tracking-wider uppercase text-ink-soft sm:inline">
            · {dueCount} due
          </span>
          <div className="ml-1 flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="grid size-7 place-items-center rounded-lg border border-line bg-paper-raised text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="grid size-7 place-items-center rounded-lg border border-line bg-paper-raised text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* body: grid + upcoming */}
      <div className="flex flex-col gap-6 p-5 lg:flex-row">
        {/* gridline calendar */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-line bg-line">
          <div className="grid grid-cols-7 gap-px bg-line">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="bg-sunken py-1.5 text-center font-mono text-[10px] font-semibold tracking-wider uppercase text-ink-soft"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-line">
            {weeks.map((week) =>
              week.map((cell) => {
                const shown = cell.tasks.slice(0, 3);
                const extra = cell.tasks.length - shown.length;
                return (
                  <div
                    key={cell.key}
                    className={cn(
                      "relative min-h-[60px] p-1 transition-colors",
                      !cell.inMonth
                        ? "bg-paper-raised/40"
                        : cell.today
                          ? "bg-signal-soft ring-1 ring-inset ring-signal/40"
                          : "bg-card hover:bg-paper-raised",
                    )}
                  >
                    <div className="flex items-center justify-end">
                      <span
                        className={cn(
                          "tnum grid size-5 place-items-center rounded-full font-mono text-[10.5px] font-semibold",
                          !cell.inMonth
                            ? "text-ink-soft/50"
                            : cell.today
                              ? "bg-signal text-white"
                              : "text-ink-soft",
                        )}
                      >
                        {cell.day}
                      </span>
                    </div>

                    {cell.inMonth && cell.tasks.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {shown.map((t) => {
                          const color =
                            projectById(t.projectId)?.color ?? "var(--signal)";
                          const active = hovered === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onMouseEnter={() => setHovered(t.id)}
                              onMouseLeave={() => setHovered(null)}
                              onClick={() => ws.openTask(t.id)}
                              aria-label={t.title}
                              className={cn(
                                "relative size-2 rounded-full transition-transform",
                                active && "scale-150",
                              )}
                              style={{ background: color }}
                            >
                              {active && <ChipTooltip task={t} />}
                            </button>
                          );
                        })}
                        {extra > 0 && (
                          <span className="tnum font-mono text-[9px] font-bold text-ink-soft">
                            +{extra}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* upcoming deadlines */}
        <div className="lg:w-72 lg:shrink-0">
          <h3 className="mb-2.5 text-[12px] font-bold tracking-wide text-ink-soft uppercase">
            Upcoming deadlines
          </h3>
          {upcoming.length > 0 ? (
            <div className="space-y-1">
              {upcoming.map((t) => {
                const project = projectById(t.projectId);
                const color = project?.color ?? "var(--signal)";
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => ws.openTask(t.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-paper-raised"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {t.title}
                      </span>
                      <span className="block truncate text-[11px] text-ink-soft">
                        {project?.name ?? "No project"}
                      </span>
                    </span>
                    <span className="tnum shrink-0 font-mono text-[11px] tracking-wider text-ink-soft">
                      {t.due}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-8 text-[12.5px] text-ink-soft">
              <CalendarDays className="size-4" strokeWidth={1.6} />
              No upcoming deadlines.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Absolutely-positioned, high-z tooltip for a hovered task chip. */
function ChipTooltip({ task }: { task: Task }) {
  const project = projectById(task.projectId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14 }}
      className="absolute bottom-full left-1/2 z-[40] mb-2 w-48 -translate-x-1/2 rounded-lg border border-line bg-popover p-2.5 text-left shadow-float"
    >
      <p className="text-[12px] font-semibold leading-snug text-ink">
        {task.title}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-ink-muted">
        {project?.name ?? "No project"}
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-wider uppercase text-ink-soft">
        Due {task.due}
      </p>
    </motion.div>
  );
}
