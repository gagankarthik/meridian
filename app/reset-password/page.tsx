"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmResetPassword, confirmSignIn } from "aws-amplify/auth";
import { ArrowRight, Check, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { authErrorMessage, cognitoConfigured } from "@/lib/cognito";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // Forgot-password links carry email + code in the query; invited users
  // arrive without them and complete their first-sign-in challenge instead.
  const [reset, setReset] = useState<{ email: string | null; code: string | null }>(
    { email: null, code: null },
  );

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setReset({ email: sp.get("email"), code: sp.get("code") });
  }, []);

  const isForgot = Boolean(reset.code && reset.email);
  const needsName = !isForgot;
  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid =
    password.length >= MIN_LENGTH &&
    confirm === password &&
    (!needsName || name.trim().length > 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setServerError(null);

    if (!cognitoConfigured) {
      router.push("/app");
      return;
    }

    try {
      if (reset.code && reset.email) {
        await confirmResetPassword({
          username: reset.email,
          confirmationCode: reset.code,
          newPassword: password,
        });
        router.push("/login");
      } else {
        // Invited user setting their password + name on first sign-in.
        // They already belong to a workspace, so they skip onboarding.
        await confirmSignIn({
          challengeResponse: password,
          options: { userAttributes: { name: name.trim() } },
        });
        router.push("/app");
      }
    } catch (err) {
      setServerError(
        authErrorMessage(err, "Couldn't set your password. The link may have expired."),
      );
    }
  }

  // Show inline guidance as the user types; force it after a failed submit.
  const shouldShow = touched || tooShort || mismatch;
  const error = shouldShow
    ? tooShort
      ? `Password must be at least ${MIN_LENGTH} characters.`
      : mismatch
        ? "Passwords don't match."
        : null
    : null;

  return (
    <AuthShell
      title={isForgot ? "Set a new password" : "Create your password"}
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-line bg-signal-soft/60 p-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-signal text-white">
          <ShieldCheck className="size-4" />
        </span>
        <p className="text-sm leading-relaxed text-ink-muted">
          {isForgot
            ? "Choose a new password for your Meridian account."
            : "Welcome to Meridian! You were invited — set a password to activate your account."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {needsName && (
          <div>
            <label
              htmlFor="fullname"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Your name
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
                <User className="size-4" />
              </span>
              <input
                id="fullname"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Avery Quinn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(inputClass, "pr-3")}
              />
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            New password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
              <Lock className="size-4" />
            </span>
            <input
              id="password"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, "pr-10", tooShort && errorRing)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink-muted"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Confirm password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
              <Lock className="size-4" />
            </span>
            <input
              id="confirm"
              type={show ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={cn(inputClass, "pr-10", mismatch && errorRing)}
            />
            {valid ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green">
                <Check className="size-4" strokeWidth={3} />
              </span>
            ) : null}
          </div>
        </div>

        {error ?? serverError ? (
          <p className="text-sm font-medium text-destructive">
            {error ?? serverError}
          </p>
        ) : null}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-signal-strong focus:outline-none focus:ring-2 focus:ring-signal-soft"
        >
          Set password &amp; continue
          <ArrowRight className="size-4" />
        </button>
      </form>
    </AuthShell>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-soft transition-colors outline-none focus:border-signal focus:ring-2 focus:ring-signal-soft";

const errorRing =
  "border-destructive focus:border-destructive focus:ring-destructive/20";
