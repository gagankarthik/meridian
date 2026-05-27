/**
 * Client-side user preferences (theme, default view, notification opt-ins).
 * Persisted to localStorage so they survive reloads and follow the signed-in
 * browser. The theme is applied by toggling the `.dark` class on <html>, which
 * the design tokens in globals.css key off of.
 */
import { useEffect, useState } from "react";

/** Fired in-tab when preferences change, so live UI (e.g. links) can react. */
export const PREFS_EVENT = "meridian:prefs";

export type ThemePref = "system" | "light" | "dark";

export type NotificationPrefs = {
  digest: boolean;
  mentions: boolean;
  assigned: boolean;
  approvals: boolean;
};

export type Preferences = {
  theme: ThemePref;
  defaultView: string;
  notif: NotificationPrefs;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  defaultView: "board",
  notif: { digest: true, mentions: true, assigned: true, approvals: false },
};

export const PREFS_KEY = "meridian.prefs";

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      notif: { ...DEFAULT_PREFERENCES.notif, ...(parsed.notif ?? {}) },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Preferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage full / unavailable — preferences stay in-memory for the session */
  }
  // Let same-tab listeners (project links, etc.) pick up the change immediately.
  window.dispatchEvent(new CustomEvent(PREFS_EVENT, { detail: prefs }));
}

const VIEW_PATHS: Record<string, string> = {
  summary: "/app/summary",
  board: "/app/board",
  table: "/app/table",
  timeline: "/app/timeline",
};

/** Route a project should open to, honouring the user's default-view choice. */
export function projectHref(view: string, projectId: string): string {
  const base = VIEW_PATHS[view] ?? "/app/summary";
  return `${base}?project=${projectId}`;
}

/**
 * The user's chosen default project view. Starts at "summary" (matching SSR)
 * and resolves to the saved value after mount, updating live when the
 * preference changes in this tab or another.
 */
export function useDefaultProjectView(): string {
  const [view, setView] = useState<string>("summary");
  useEffect(() => {
    const sync = () => setView(loadPreferences().defaultView);
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return view;
}

/** Resolve + apply the active theme by toggling `.dark` on the document root. */
export function applyTheme(theme: ThemePref) {
  if (typeof document === "undefined") return;
  const systemDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && Boolean(systemDark));
  document.documentElement.classList.toggle("dark", dark);
}
