import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Columns3,
  GanttChartSquare,
  LifeBuoy,
  Mail,
  Users,
} from "lucide-react";

export const metadata: Metadata = { title: "Help" };

const GUIDES = [
  {
    icon: Columns3,
    title: "Working with boards",
    body: "Open a project and use the Board tab to drag tasks across columns. Click any task to open its full page with sub-tasks, comments, and details.",
  },
  {
    icon: GanttChartSquare,
    title: "Planning on the roadmap",
    body: "Set each project's start and end dates in its Settings tab — they position the project on the Roadmap. Click a bar to open its details.",
  },
  {
    icon: Users,
    title: "Inviting your team",
    body: "From a project's Team tab, invite teammates by email and pick their role. They get an email with a temporary password and set their own on first sign-in.",
  },
  {
    icon: CheckCircle2,
    title: "Approvals",
    body: "Request sign-off on work in the Approvals tab. Reviewers can approve or reject, and the status is saved for everyone.",
  },
];

const FAQS = [
  {
    q: "How do I change the app theme?",
    a: "Go to Settings → Appearance and choose System, Light, or Dark. Your choice is remembered on this device.",
  },
  {
    q: "Who can edit organisation details?",
    a: "Owners and admins can edit the organisation name, company, size, industry, and logo from Settings → Organisation. Everyone else sees them read-only.",
  },
  {
    q: "How do I upload a company logo?",
    a: "During onboarding, or later in Settings → Organisation. The image is resized automatically and shown in the top-left of the app.",
  },
  {
    q: "Why does a new account show no data?",
    a: "New workspaces start empty. Create your first project, add tasks, and invite teammates to populate boards, the roadmap, and reports.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-0 max-w-[900px] space-y-8 p-5 sm:p-6 lg:p-8">
      <header>
        <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
          <LifeBuoy className="size-4 text-signal" />
          Help &amp; support
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
          How can we help?
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14px] text-ink-muted">
          Quick guides to get the most out of Meridian, plus answers to common
          questions. Still stuck? Reach out and we&apos;ll get back to you.
        </p>
      </header>

      {/* guides */}
      <section>
        <h2 className="mb-3 inline-flex items-center gap-2 text-[15px] font-bold tracking-tight text-ink">
          <BookOpen className="size-4 text-signal" />
          Getting started
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <div
              key={g.title}
              className="rounded-2xl border border-line bg-card p-5 shadow-card"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-signal-soft text-signal">
                <g.icon className="size-5" strokeWidth={1.9} />
              </span>
              <h3 className="mt-3 text-[14px] font-bold text-ink">{g.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                {g.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* faqs */}
      <section>
        <h2 className="mb-3 text-[15px] font-bold tracking-tight text-ink">
          Frequently asked
        </h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-semibold text-ink">
                {f.q}
                <span className="ml-4 text-ink-soft transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* contact */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-6 shadow-card">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-ink">
            Still need a hand?
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Email our team and we&apos;ll help you out.
          </p>
        </div>
        <a
          href="mailto:support@meridian.work"
          className="inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
        >
          <Mail className="size-4" />
          Contact support
        </a>
      </section>
    </div>
  );
}
