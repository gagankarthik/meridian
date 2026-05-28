"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signUp,
} from "aws-amplify/auth";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthChecking, useRedirectIfAuthed } from "@/components/auth/auth-redirect";
import { authErrorMessage, cognitoConfigured } from "@/lib/cognito";
import { cn } from "@/lib/utils";

const STRENGTH = [
  { label: "Too short", color: "#e34935" },
  { label: "Weak", color: "#d9842b" },
  { label: "Good", color: "#e2a200" },
  { label: "Strong", color: "#22a06b" },
];

function scorePassword(value: string): number {
  if (!value) return -1;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  // Map 0..4 raw signals onto a 0..3 strength scale.
  return Math.min(3, Math.max(0, score - 1));
}

export default function SignupPage() {
  const router = useRouter();
  const checkingAuth = useRedirectIfAuthed();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  const strength = scorePassword(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Demo mode (no Cognito configured) keeps the original navigation.
    if (!cognitoConfigured) {
      router.push("/onboarding");
      return;
    }

    try {
      const res = await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name } },
      });
      if (res.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        // Cognito emailed a verification code — show the OTP step.
        setStep("verify");
        setSubmitting(false);
      } else {
        await signIn({ username: email, password });
        router.push("/onboarding");
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "UsernameExistsException") {
        setError("An account with this email already exists — sign in instead.");
      } else {
        setError(
          authErrorMessage(err, "Couldn't create your account. Please try again."),
        );
      }
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code.trim() });
      try {
        await signIn({ username: email, password });
      } catch {
        /* already signed in or needs manual login — continue regardless */
      }
      router.push("/onboarding");
    } catch (err) {
      setError(authErrorMessage(err, "That code didn't work. Check it and try again."));
      setSubmitting(false);
    }
  }

  async function resend() {
    try {
      await resendSignUpCode({ username: email });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError(authErrorMessage(err, "Couldn't resend the code."));
    }
  }

  if (checkingAuth) return <AuthChecking />;

  if (step === "verify") {
    return (
      <AuthShell
        title="Verify your email"
        subtitle={`Enter the 6-digit code we sent to ${email}.`}
      >
        <form onSubmit={handleVerify} className="space-y-5">
          <Field label="Verification code" htmlFor="code">
            <InputWrap icon={<ShieldCheck className="size-4" />}>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={cn(inputClass, "tracking-[0.3em]")}
              />
            </InputWrap>
          </Field>

          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting ? "Verifying…" : "Verify & continue"}
            {!submitting ? <ArrowRight className="size-4" /> : null}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Didn&apos;t get it?{" "}
            <button
              type="button"
              onClick={resend}
              className="font-medium text-signal transition-colors hover:text-signal-strong"
            >
              {resent ? "Code resent ✓" : "Resend code"}
            </button>
          </p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your 14-day trial — no credit card required."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Full name" htmlFor="name">
          <InputWrap icon={<User className="size-4" />}>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Dana Whitfield"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </InputWrap>
        </Field>

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

        <Field label="Password" htmlFor="password">
          <InputWrap icon={<Lock className="size-4" />}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

          {strength >= 0 ? (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor:
                        i <= strength
                          ? STRENGTH[strength].color
                          : "var(--line)",
                    }}
                  />
                ))}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: STRENGTH[strength].color }}
              >
                {STRENGTH[strength].label}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-ink-soft">
              Use 8+ characters with a mix of letters, numbers &amp; symbols.
            </p>
          )}
        </Field>

        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting ? "Creating account…" : "Create account"}
          {!submitting ? <ArrowRight className="size-4" /> : null}
        </button>

        <p className="text-center text-xs leading-relaxed text-ink-soft">
          By creating an account you agree to Meridian&apos;s Terms of Service
          and Privacy Policy.
        </p>
      </form>

      <p className="mt-7 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-signal transition-colors hover:text-signal-strong"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

/* ---------- local form primitives ---------- */

const inputClass =
  "w-full rounded-lg border border-line bg-paper py-3 pl-10 pr-3 text-base text-ink placeholder:text-ink-soft transition-colors outline-none focus:border-signal focus:ring-2 focus:ring-signal-soft sm:py-2.5 sm:text-sm";

const primaryButton =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-signal-strong focus:outline-none focus:ring-2 focus:ring-signal-soft active:translate-y-px disabled:opacity-70 sm:py-2.5";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
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
