import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  CalendarRange,
  GanttChartSquare,
  GitBranch,
  Globe2,
  LayoutDashboard,
  LineChart,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "Views", href: "#views" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
] as const;

/** Representative customer wordmarks (placeholder names for this template). */
export const CUSTOMERS = [
  "NORTHWIND",
  "Vantage",
  "HELIOS",
  "Cobalt Labs",
  "MERITON",
  "Greycliff",
  "AXIOM",
  "Lumen & Co.",
] as const;

export type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  meta: string;
};

export const FEATURES: Feature[] = [
  {
    icon: GitBranch,
    title: "Navigate dependencies",
    body: "Get ahead of potential disruptions and uncertainties — before they impact your team's work.",
    meta: "Planning",
  },
  {
    icon: Boxes,
    title: "Conquer complexity",
    body: "No matter how many teams are involved, break down even the most daunting strategic plans into small, achievable steps.",
    meta: "Scale",
  },
  {
    icon: Radar,
    title: "Total visibility",
    body: "View and organize work across teams so you can better manage resourcing and make informed strategic decisions.",
    meta: "Visibility",
  },
  {
    icon: GanttChartSquare,
    title: "Gantt chart",
    body: "A powerful visualization to track work and avoid roadblocks — outline durations, indicate milestones, and map out dependencies.",
    meta: "Timeline",
  },
  {
    icon: LayoutDashboard,
    title: "Your view, your way",
    body: "Stay up to date on progress using the view you like: boards, lists, timeline, or calendars.",
    meta: "Views",
  },
  {
    icon: Workflow,
    title: "Coordinate big launches",
    body: "Connect engineering, product, and marketing initiatives to coordinate launches across every team.",
    meta: "Teams",
  },
];

export type WorkflowStep = {
  index: string;
  phase: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

export const WORKFLOW: WorkflowStep[] = [
  {
    index: "01",
    phase: "Planning",
    title: "Evolving requirements? No problem.",
    body: "Analyze projects and confidently communicate to stakeholders with clear visibility on progress and priorities.",
    icon: CalendarRange,
  },
  {
    index: "02",
    phase: "Execution & tracking",
    title: "Coordinate work, streamline processes.",
    body: "Track projects, map dependencies, and build approval workflows across teams to keep goals on track.",
    icon: Workflow,
  },
  {
    index: "03",
    phase: "Reporting & results",
    title: "Hone and perfect workflow processes.",
    body: "With project summaries at your fingertips, plan smarter and stay on top of initiatives and projects.",
    icon: LineChart,
  },
];

export type Metric = { value: number; suffix: string; label: string };

export const METRICS: Metric[] = [
  { value: 99.99, suffix: "%", label: "Platform uptime, multi-region" },
  { value: 4.2, suffix: "M", label: "Tasks shipped each week" },
  { value: 38, suffix: "%", label: "Less time in status meetings" },
  { value: 100, suffix: "ms", label: "Median read, anywhere on earth" },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We retired four tools and a quarter of our status meetings. Meridian became the single place leadership actually trusts for the real state of work.",
    name: "Dana Whitfield",
    role: "VP, Program Management",
    company: "Northwind",
  },
  {
    quote:
      "The dependency map paid for the platform in the first month. We caught a cross-team blocker before it ever reached the roadmap.",
    name: "Marco Iervolino",
    role: "Director of Engineering",
    company: "Helios",
  },
];

export type PlanTier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const PLANS: PlanTier[] = [
  {
    name: "Team",
    price: "$12",
    cadence: "/ user / month",
    blurb: "For growing teams putting work in one place.",
    features: [
      "Unlimited boards & timelines",
      "Dashboards & reporting",
      "Core automations",
      "Up to 50 members",
    ],
    cta: "Start free",
  },
  {
    name: "Business",
    price: "$22",
    cadence: "/ user / month",
    blurb: "For scaling orgs that run on dependencies and SLAs.",
    features: [
      "Everything in Team",
      "Portfolio rollups",
      "Advanced rules engine",
      "SSO / SCIM provisioning",
      "Priority support",
    ],
    cta: "Start free",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual",
    blurb: "For regulated, global organizations.",
    features: [
      "Multi-region residency",
      "Audit log & retention",
      "Dedicated success team",
      "99.99% uptime SLA",
      "Custom DPA & reviews",
    ],
    cta: "Talk to sales",
  },
];

export type Compliance = { label: string; icon: LucideIcon; note: string };

export const COMPLIANCE: Compliance[] = [
  { label: "SOC 2 Type II", icon: ShieldCheck, note: "Audited annually" },
  { label: "ISO 27001", icon: Lock, note: "Certified ISMS" },
  { label: "GDPR", icon: Globe2, note: "EU data residency" },
  { label: "HIPAA", icon: ShieldCheck, note: "BAA available" },
  { label: "SSO / SAML", icon: Users, note: "SCIM provisioning" },
  { label: "AES-256", icon: Sparkles, note: "At rest & in transit" },
];
