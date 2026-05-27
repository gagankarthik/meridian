"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "aws-amplify/auth";
import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { authErrorMessage, cognitoConfigured } from "@/lib/cognito";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cognitoConfigured) {
      setSent(true);
      return;
    }

    try {
      await resetPassword({ username: email });
      setSent(true);
    } catch (err) {
      setError(
        authErrorMessage(err, "Couldn't send a reset link. Please try again."),
      );
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="If an account exists, a reset link is on its way."
      >
        <div className="rounded-xl border border-line bg-paper-raised p-6 text-center">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-signal-soft text-signal">
            <MailCheck className="size-6" />
          </span>
          <p className="text-sm leading-relaxed text-ink-muted">
            We sent a password reset link to{" "}
            <span className="font-semibold text-ink">{email}</span>. Follow the
            instructions in the email to choose a new password.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Didn&apos;t get it? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-signal transition-colors hover:text-signal-strong"
          >
            try another email
          </button>
          .
        </p>

        <Link
          href="/login"
          className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email tied to your account and we'll send a secure reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Work email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
              <Mail className="size-4" />
            </span>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-soft transition-colors outline-none focus:border-signal focus:ring-2 focus:ring-signal-soft"
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-signal-strong focus:outline-none focus:ring-2 focus:ring-signal-soft"
        >
          Send reset link
          <ArrowRight className="size-4" />
        </button>
      </form>

      <Link
        href="/login"
        className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </AuthShell>
  );
}
