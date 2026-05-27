"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "aws-amplify/auth";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { authErrorMessage, cognitoConfigured } from "@/lib/cognito";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Demo mode (no Cognito configured) keeps the original navigation.
    if (!cognitoConfigured) {
      router.push("/app");
      return;
    }

    try {
      const { nextStep } = await signIn({ username: email, password });
      if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        // Invited users set their password on first sign-in.
        router.push("/reset-password");
      } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
        setError("Please verify your account from the email we sent, then sign in.");
        setSubmitting(false);
      } else {
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next && next.startsWith("/app") ? next : "/app");
      }
    } catch (err) {
      setError(
        authErrorMessage(err, "Couldn't sign in. Check your details and try again."),
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Meridian workspace to pick up where you left off."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Work email" htmlFor="email">
          <InputWrap icon={<Mail className="size-4" />}>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </InputWrap>
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          aside={
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-signal transition-colors hover:text-signal-strong"
            >
              Forgot password?
            </Link>
          }
        >
          <InputWrap icon={<Lock className="size-4" />}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink-muted"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </InputWrap>
        </Field>

        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border-line-strong text-signal accent-signal focus:ring-signal"
          />
          Keep me signed in
        </label>

        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? "Signing in…" : "Sign in"}
          {!submitting ? <ArrowRight className="size-4" /> : null}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-muted">
        New to Meridian?{" "}
        <Link
          href="/signup"
          className="font-medium text-signal transition-colors hover:text-signal-strong"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

/* ---------- shared form primitives (local to auth pages) ---------- */

const inputClass =
  "w-full rounded-lg border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-soft transition-colors outline-none focus:border-signal focus:ring-2 focus:ring-signal-soft";

const primaryButton =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-signal-strong focus:outline-none focus:ring-2 focus:ring-signal-soft disabled:opacity-70";

function Field({
  label,
  htmlFor,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-ink"
        >
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

function InputWrap({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
        {icon}
      </span>
      {children}
    </div>
  );
}

