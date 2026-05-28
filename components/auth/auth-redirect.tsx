"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { cognitoConfigured } from "@/lib/cognito";

/**
 * Sends already-signed-in visitors away from auth pages (login/signup/forgot)
 * to the app. Uses `getCurrentUser()` (which validates/refreshes the session)
 * rather than a raw cookie check, so a stale cookie can't cause a redirect
 * loop with the app's auth gate.
 *
 * Returns `true` while the session is being checked, so the page can hold a
 * loader instead of flashing the form to a logged-in user.
 */
export function useRedirectIfAuthed(): boolean {
  const router = useRouter();
  const [checking, setChecking] = useState(cognitoConfigured);

  useEffect(() => {
    if (!cognitoConfigured) return;
    let active = true;
    getCurrentUser()
      .then(() => {
        if (active) router.replace("/app");
      })
      .catch(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  return checking;
}

/** Minimal full-screen loader shown while the session check runs. */
export function AuthChecking() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper">
      <span className="size-7 animate-spin rounded-full border-2 border-line border-t-signal" />
    </main>
  );
}
