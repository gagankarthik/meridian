import type { Metadata } from "next";
import { LegalShell, type LegalSection } from "@/components/marketing/legal-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern your use of Meridian.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance of terms",
    body: (
      <p>
        By accessing or using Meridian, you agree to be bound by these Terms &
        Conditions. If you are using Meridian on behalf of an organisation, you
        represent that you have authority to bind that organisation to these
        terms.
      </p>
    ),
  },
  {
    heading: "Your account",
    body: (
      <p>
        You are responsible for safeguarding your credentials and for all
        activity under your account. Notify us immediately of any unauthorised
        use. You must provide accurate information and keep it up to date.
      </p>
    ),
  },
  {
    heading: "Acceptable use",
    body: (
      <p>
        You agree not to misuse the service, including by attempting to access
        it through unauthorised means, disrupting its operation, uploading
        unlawful or infringing content, or using it to violate the rights of
        others.
      </p>
    ),
  },
  {
    heading: "Your content",
    body: (
      <p>
        You retain ownership of the content you create in Meridian. You grant us
        a limited licence to host, store, and process that content solely to
        provide and improve the service. You are responsible for the content you
        and your workspace members submit.
      </p>
    ),
  },
  {
    heading: "Subscriptions & billing",
    body: (
      <p>
        Paid plans, where offered, are billed in advance on the cadence shown at
        checkout and are non-refundable except where required by law. We may
        change pricing with reasonable notice.
      </p>
    ),
  },
  {
    heading: "Availability & changes",
    body: (
      <p>
        We work to keep Meridian available and reliable but do not guarantee
        uninterrupted access. We may add, change, or remove features, and may
        suspend access for maintenance or to protect the service.
      </p>
    ),
  },
  {
    heading: "Disclaimers & liability",
    body: (
      <p>
        The service is provided &ldquo;as is&rdquo; without warranties of any
        kind to the extent permitted by law. To the maximum extent permitted, we
        are not liable for indirect or consequential damages arising from your
        use of the service.
      </p>
    ),
  },
  {
    heading: "Termination",
    body: (
      <p>
        You may stop using Meridian at any time. We may suspend or terminate
        access if you breach these terms. On termination, your right to use the
        service ends, subject to provisions that survive by their nature.
      </p>
    ),
  },
  {
    heading: "Contact",
    body: (
      <p>
        Questions about these terms can be sent to{" "}
        <a
          href="mailto:legal@meridian.work"
          className="font-semibold text-signal hover:underline"
        >
          legal@meridian.work
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms & Conditions"
      updated="May 27, 2026"
      intro="These Terms & Conditions govern your access to and use of Meridian. Please read them carefully — by using the service you agree to them."
      sections={SECTIONS}
    />
  );
}
