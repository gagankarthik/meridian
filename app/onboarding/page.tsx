"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Code2,
  Columns3,
  FileText,
  GanttChartSquare,
  LayoutGrid,
  Mail,
  Megaphone,
  PartyPopper,
  Plus,
  Server,
  Trash2,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import {
  ChoiceCard,
  Field,
  SelectField,
  StepHeader,
  StepProgress,
} from "@/components/auth/onboarding-steps";
import { PROJECTS } from "@/lib/app-data";
import { authedFetch } from "@/lib/api-client";
import { cognitoConfigured } from "@/lib/cognito";
import { downscaleImage } from "@/lib/image";
import { cn } from "@/lib/utils";

/* ============================================================
   Company onboarding wizard — local step state, AnimatePresence
   transitions, mobile-first responsive premium card layout.
   ============================================================ */

const STEPS = [
  { n: 1, label: "Company" },
  { n: 2, label: "Workspace" },
  { n: 3, label: "Team" },
  { n: 4, label: "Project" },
  { n: 5, label: "Done" },
];
const TOTAL = STEPS.length;

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const INDUSTRIES = [
  "Software",
  "Marketing/Agency",
  "IT/Operations",
  "Finance",
  "Other",
];

/** Solution cards — mirror the marketing landing "for every team" set. */
const SOLUTIONS = [
  {
    id: "software",
    icon: Code2,
    tint: "#2563eb",
    label: "Software development",
    description: "Track bugs, ship releases, skip the status meetings.",
  },
  {
    id: "marketing",
    icon: Megaphone,
    tint: "#e34935",
    label: "Marketing",
    description: "Plan campaigns and manage creative workflows.",
  },
  {
    id: "pm",
    icon: ClipboardList,
    tint: "#22a06b",
    label: "Project management",
    description: "Track work, manage requests, keep ops running.",
  },
  {
    id: "it",
    icon: Server,
    tint: "#e2a200",
    label: "IT",
    description: "Coordinate timelines and deliverables across teams.",
  },
];

/** First-project templates. */
const TEMPLATES = [
  {
    id: "kanban",
    icon: Columns3,
    tint: "#2563eb",
    label: "Kanban",
    description: "Visualize work as it flows across columns.",
  },
  {
    id: "sprint",
    icon: LayoutGrid,
    tint: "#06b6d4",
    label: "Sprint",
    description: "Plan in cycles with backlog and velocity.",
  },
  {
    id: "timeline",
    icon: GanttChartSquare,
    tint: "#22a06b",
    label: "Timeline",
    description: "Map milestones and dependencies over time.",
  },
  {
    id: "blank",
    icon: FileText,
    tint: "#8b909c",
    label: "Blank",
    description: "Start from scratch and shape it your way.",
  },
];

type InviteRole = "Member" | "Admin" | "Viewer";
const ROLES: InviteRole[] = ["Member", "Admin", "Viewer"];

type Invite = {
  id: string;
  email: string;
  role: InviteRole;
  projects: string[];
};

function newInvite(): Invite {
  return {
    id: `inv-${Math.random().toString(36).slice(2, 9)}`,
    email: "",
    role: "Member",
    projects: [],
  };
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
};

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 — Company
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState(COMPANY_SIZES[1]);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);

  // Step 2 — Workspace
  const [workspaceDirty, setWorkspaceDirty] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [solutions, setSolutions] = useState<string[]>([]);

  // Workspace name prefills from company until the user edits it.
  const workspaceValue = workspaceDirty ? workspaceName : companyName;

  // Step 3 — Invites
  const [invites, setInvites] = useState<Invite[]>([newInvite()]);

  // Step 4 — First project
  const [projectName, setProjectName] = useState("");
  const [template, setTemplate] = useState<string>("");

  // Company logo (stored as a data URL on the workspace).
  const [logo, setLogo] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(await downscaleImage(file, 256));
  }

  // Create the workspace (live) and enter the app. Demo mode just navigates.
  async function finish() {
    if (cognitoConfigured) {
      try {
        await authedFetch("/api/onboarding", {
          method: "POST",
          body: JSON.stringify({
            workspaceName: workspaceValue,
            companyName,
            projectName: projectName.trim(),
            logo: logo ?? undefined,
          }),
        });
      } catch {
        /* fall through to navigation */
      }
    }
    router.push("/app");
  }

  const filledInvites = useMemo(
    () => invites.filter((i) => i.email.trim().length > 0),
    [invites],
  );

  // Required-field gating per step.
  const canContinue = (() => {
    switch (step) {
      case 1:
        return companyName.trim().length > 1;
      case 2:
        return workspaceValue.trim().length > 1 && solutions.length > 0;
      default:
        return true;
    }
  })();

  // Steps the user may skip (no required fields lost by skipping).
  const isSkippable = step === 3 || step === 4;

  function goTo(target: number) {
    setDirection(target > step ? 1 : -1);
    setStep(Math.min(TOTAL, Math.max(1, target)));
  }
  function next() {
    if (step < TOTAL) goTo(step + 1);
  }
  function back() {
    if (step > 1) goTo(step - 1);
  }

  function updateInvite(id: string, patch: Partial<Invite>) {
    setInvites((list) =>
      list.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  }
  function toggleInviteProject(id: string, projectId: string) {
    setInvites((list) =>
      list.map((i) => {
        if (i.id !== id) return i;
        const has = i.projects.includes(projectId);
        return {
          ...i,
          projects: has
            ? i.projects.filter((p) => p !== projectId)
            : [...i.projects, projectId],
        };
      }),
    );
  }
  function toggleSolution(id: string) {
    setSolutions((list) =>
      list.includes(id) ? list.filter((s) => s !== id) : [...list, id],
    );
  }

  const selectedSolutionLabels = SOLUTIONS.filter((s) =>
    solutions.includes(s.id),
  ).map((s) => s.label);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-paper-raised px-4 py-8 sm:py-12">
      <div className="brand-wash pointer-events-none absolute inset-0" />

      <div className="relative flex w-full max-w-[680px] flex-col">
        <div className="mb-7 flex justify-center sm:mb-8">
          <Wordmark className="text-ink" />
        </div>

        <div className="mb-6 sm:mb-7">
          <StepProgress steps={STEPS} current={step} />
        </div>

        <div className="rounded-2xl border border-line bg-paper p-5 shadow-raised sm:p-8">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ---------- Step 1: Company ---------- */}
              {step === 1 ? (
                <section>
                  <StepHeader
                    icon={<Building2 className="size-5" />}
                    title="Tell us about your company"
                    subtitle="We'll use this to tailor Meridian to how your team works."
                  />
                  <div className="mt-6 space-y-5">
                    <Field
                      id="company"
                      label="Company name"
                      autoFocus
                      placeholder="Northwind"
                      value={companyName}
                      onChange={setCompanyName}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <SelectField
                        id="size"
                        label="Company size"
                        value={companySize}
                        onChange={setCompanySize}
                        options={COMPANY_SIZES}
                      />
                      <SelectField
                        id="industry"
                        label="Industry"
                        value={industry}
                        onChange={setIndustry}
                        options={INDUSTRIES}
                      />
                    </div>
                  </div>
                </section>
              ) : null}

              {/* ---------- Step 2: Workspace ---------- */}
              {step === 2 ? (
                <section>
                  <StepHeader
                    icon={<LayoutGrid className="size-5" />}
                    title="Set up your workspace"
                    subtitle="Name your workspace and pick what your team will manage."
                  />
                  <div className="mt-6 space-y-6">
                    <Field
                      id="workspace"
                      label="Workspace name"
                      placeholder="Northwind"
                      value={workspaceValue}
                      onChange={(v) => {
                        setWorkspaceDirty(true);
                        setWorkspaceName(v);
                      }}
                      hint="Prefilled from your company — edit it if you like."
                    />

                    {/* company logo */}
                    <div>
                      <span className="mb-1.5 block text-sm font-medium text-ink">
                        Company logo
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-paper-raised text-[15px] font-bold text-ink-soft">
                          {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo} alt="" className="size-full object-cover" />
                          ) : (
                            (workspaceValue || "W").slice(0, 1).toUpperCase()
                          )}
                        </span>
                        <input
                          ref={logoRef}
                          type="file"
                          accept="image/*"
                          onChange={onLogo}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoRef.current?.click()}
                          className="rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:border-signal/40"
                        >
                          {logo ? "Change logo" : "Upload logo"}
                        </button>
                        {logo && (
                          <button
                            type="button"
                            onClick={() => setLogo(null)}
                            className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-ink-soft">
                        PNG or SVG, square works best. You can change it later in
                        Settings.
                      </p>
                    </div>
                    <div>
                      <span className="mb-1 block text-sm font-medium text-ink">
                        What will you manage?
                      </span>
                      <p className="mb-3 text-xs text-ink-soft">
                        Choose one or more — we&apos;ll set up the right
                        templates and views.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {SOLUTIONS.map((s) => (
                          <ChoiceCard
                            key={s.id}
                            icon={s.icon}
                            tint={s.tint}
                            label={s.label}
                            description={s.description}
                            selected={solutions.includes(s.id)}
                            onClick={() => toggleSolution(s.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* ---------- Step 3: Invite team ---------- */}
              {step === 3 ? (
                <section>
                  <StepHeader
                    icon={<Users className="size-5" />}
                    title="Invite your team"
                    subtitle="Choose a role and the areas each teammate can access."
                  />
                  <div className="mt-6 space-y-4">
                    {invites.map((invite, idx) => (
                      <div
                        key={invite.id}
                        className="rounded-xl border border-line bg-paper-raised p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                            Teammate {idx + 1}
                          </span>
                          {invites.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setInvites((list) =>
                                  list.filter((i) => i.id !== invite.id),
                                )
                              }
                              aria-label="Remove teammate"
                              className="text-ink-soft transition-colors hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                          <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
                              <Mail className="size-4" />
                            </span>
                            <input
                              type="email"
                              placeholder="teammate@company.com"
                              value={invite.email}
                              onChange={(e) =>
                                updateInvite(invite.id, {
                                  email: e.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-signal focus:ring-2 focus:ring-signal-soft"
                            />
                          </div>
                          <select
                            value={invite.role}
                            onChange={(e) =>
                              updateInvite(invite.id, {
                                role: e.target.value as InviteRole,
                              })
                            }
                            aria-label="Role"
                            className="rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-signal focus:ring-2 focus:ring-signal-soft sm:w-32"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-3">
                          <span className="mb-2 block text-xs font-medium text-ink-muted">
                            Project access
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {PROJECTS.map((p) => {
                              const selected = invite.projects.includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() =>
                                    toggleInviteProject(invite.id, p.id)
                                  }
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                    selected
                                      ? "border-transparent text-white"
                                      : "border-line bg-paper text-ink-muted hover:bg-paper-raised",
                                  )}
                                  style={
                                    selected
                                      ? { backgroundColor: p.color }
                                      : undefined
                                  }
                                >
                                  {selected ? (
                                    <Check
                                      className="size-3"
                                      strokeWidth={3}
                                    />
                                  ) : (
                                    <span
                                      className="size-2 rounded-full"
                                      style={{ backgroundColor: p.color }}
                                    />
                                  )}
                                  {p.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setInvites((list) => [...list, newInvite()])
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-paper px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-signal hover:text-signal"
                    >
                      <Plus className="size-4" />
                      Add another
                    </button>

                    <p className="text-xs text-ink-soft">
                      No rush — you can skip this and invite people later from
                      Settings.
                    </p>
                  </div>
                </section>
              ) : null}

              {/* ---------- Step 4: First project ---------- */}
              {step === 4 ? (
                <section>
                  <StepHeader
                    icon={<ClipboardList className="size-5" />}
                    title="Create your first project"
                    subtitle="Optional — give it a name and pick a starting template."
                  />
                  <div className="mt-6 space-y-6">
                    <Field
                      id="project"
                      label="Project name"
                      placeholder="Q3 Product Launch"
                      value={projectName}
                      onChange={setProjectName}
                    />
                    <div>
                      <span className="mb-3 block text-sm font-medium text-ink">
                        Choose a template
                      </span>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {TEMPLATES.map((t) => (
                          <ChoiceCard
                            key={t.id}
                            icon={t.icon}
                            tint={t.tint}
                            label={t.label}
                            description={t.description}
                            selected={template === t.id}
                            onClick={() =>
                              setTemplate((cur) =>
                                cur === t.id ? "" : t.id,
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* ---------- Step 5: All set ---------- */}
              {step === 5 ? (
                <section>
                  <div className="flex flex-col items-center text-center">
                    <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-signal-soft text-signal">
                      <PartyPopper className="size-7" />
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                      You&apos;re all set
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                      Here&apos;s a quick summary before you jump into Meridian.
                    </p>
                  </div>

                  <dl className="mt-6 space-y-3">
                    <SummaryRow label="Company">
                      <span className="font-medium text-ink">
                        {companyName.trim() || "Untitled company"}
                      </span>
                    </SummaryRow>
                    <SummaryRow label="Workspace">
                      <span className="font-medium text-ink">
                        {workspaceValue.trim() || "Untitled workspace"}
                      </span>
                    </SummaryRow>
                    <SummaryRow label="Managing">
                      {selectedSolutionLabels.length === 0 ? (
                        <span className="text-ink-soft">Not specified</span>
                      ) : (
                        <span className="flex flex-wrap justify-end gap-1.5">
                          {selectedSolutionLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-signal-soft px-2 py-0.5 text-xs font-medium text-signal"
                            >
                              {label}
                            </span>
                          ))}
                        </span>
                      )}
                    </SummaryRow>
                    <SummaryRow label="Invites">
                      {filledInvites.length === 0 ? (
                        <span className="text-ink-soft">None yet</span>
                      ) : (
                        <span className="text-ink-muted">
                          {filledInvites.length} teammate
                          {filledInvites.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </SummaryRow>
                    {projectName.trim() ? (
                      <SummaryRow label="First project">
                        <span className="text-ink-muted">
                          {projectName.trim()}
                        </span>
                      </SummaryRow>
                    ) : null}
                  </dl>
                </section>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {/* ---------- nav controls ---------- */}
          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className="flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-paper-raised"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              {isSkippable ? (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  Skip
                </button>
              ) : null}

              {step < TOTAL ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canContinue}
                  className="flex items-center gap-2 rounded-lg bg-signal px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-signal-strong focus:outline-none focus:ring-2 focus:ring-signal-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="flex items-center gap-2 rounded-lg bg-signal px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-signal-strong focus:outline-none focus:ring-2 focus:ring-signal-soft"
                >
                  Go to Meridian
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 text-sm last:border-0 last:pb-0">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
