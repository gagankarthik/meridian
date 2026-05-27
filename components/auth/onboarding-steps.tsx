"use client";

import type { ComponentType, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   Shared building blocks for the company onboarding wizard.
   Kept presentational + stateless so the wizard owns all state.
   ============================================================ */

/** Numbered steps + connecting progress bar. */
export function StepProgress({
  steps,
  current,
}: {
  steps: { n: number; label: string }[];
  current: number;
}) {
  return (
    <ol className="mx-auto flex w-full max-w-md items-center">
      {steps.map((s, i) => {
        const active = current === s.n;
        const done = current > s.n;
        const lineDone = current > s.n;
        return (
          <li
            key={s.n}
            className={cn(
              "flex items-center",
              i < steps.length - 1 && "flex-1",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  done && "border-signal bg-signal text-white",
                  active && "border-signal bg-signal-soft text-signal",
                  !done && !active && "border-line bg-paper text-ink-soft",
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : s.n}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  active || done ? "text-ink" : "text-ink-soft",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-line sm:mx-3">
                <span
                  className={cn(
                    "block h-full rounded-full bg-signal transition-all duration-500 ease-out",
                    lineDone ? "w-full" : "w-0",
                  )}
                />
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Icon + title + subtitle header used at the top of each step. */
export function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal-soft text-signal">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/** A labelled text input. */
export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal focus:ring-2 focus:ring-signal-soft"
      />
      {hint ? <p className="mt-1.5 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

/** A labelled native <select>. */
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-line bg-paper bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-3 py-2.5 pr-9 text-sm text-ink outline-none transition-colors focus:border-signal focus:ring-2 focus:ring-signal-soft"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b909c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/** A selectable solution / template card with icon, label and description. */
export function ChoiceCard({
  icon: Icon,
  tint,
  label,
  description,
  selected,
  onClick,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tint: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-signal bg-signal-soft/60 shadow-card"
          : "border-line bg-paper hover:border-line-strong hover:bg-paper-raised",
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-signal bg-signal text-white"
            : "border-line bg-paper text-transparent",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span
        className="flex size-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${tint}1a`, color: tint }}
      >
        <Icon className="size-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
          {description}
        </span>
      </span>
    </button>
  );
}
