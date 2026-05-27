"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const KEY = "meridian.cookie-consent";

/**
 * Lightweight cookie-consent banner. Stores the choice in localStorage and
 * only renders once mounted (so there's no SSR/CSR hydration mismatch).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* storage unavailable — stay hidden */
    }
  }, []);

  function decide(value: "accepted" | "declined") {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-popover p-4 shadow-float sm:flex-row sm:items-center sm:gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-signal-soft text-signal">
          <Cookie className="size-5" strokeWidth={1.9} />
        </span>
        <p className="flex-1 text-[13px] leading-relaxed text-ink-muted">
          We use cookies to keep you signed in and to understand how Meridian is
          used. See our{" "}
          <Link href="/privacy" className="font-semibold text-signal hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-semibold text-signal hover:underline">
            Terms
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded-xl bg-signal px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
