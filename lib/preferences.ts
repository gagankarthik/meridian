/**
 * Client-side user preferences (theme, default view, notification opt-ins).
 * Persisted to localStorage so they survive reloads and follow the signed-in
 * browser. The theme is applied by toggling the `.dark` class on <html>, which
 * the design tokens in globals.css key off of.
 */

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
