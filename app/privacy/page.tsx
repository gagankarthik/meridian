import type { Metadata } from "next";
import { LegalShell, type LegalSection } from "@/components/marketing/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Meridian collects, uses, and protects your data.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Information we collect",
    body: (
      <>
        <p>
          We collect information you provide directly — your name, email
          address, company details, and the content you create in Meridian such
          as projects, tasks, comments, and uploaded files. When you sign in we
          also process authentication data through AWS Cognito.
        </p>
        <p>
          We automatically collect limited technical data (device, browser, and
          usage events) to keep the service secure and to understand how it is
          used.
        </p>
      </>
    ),
  },
  {
    heading: "How we use your information",
    body: (
      <p>
        We use your information to operate and improve Meridian, authenticate
        you, deliver notifications you opt into, provide support, and meet legal
        obligations. We do not sell your personal information.
      </p>
    ),
  },
  {
    heading: "Cookies & local storage",
    body: (
      <p>
        We use strictly necessary cookies to keep you signed in and local
        storage to remember preferences such as your theme and notification
        choices. You can manage your consent at any time via the banner shown on
        your first visit, and control cookies through your browser settings.
      </p>
    ),
  },
  {
    heading: "Where your data is stored",
    body: (
      <p>
        Your workspace data is stored in Amazon DynamoDB and Amazon S3 within
        the AWS region configured for your deployment. Access is restricted to
        your authenticated workspace and to service operators under strict
        controls.
      </p>
    ),
  },
  {
    heading: "Data sharing",
    body: (
      <p>
        We share data only with infrastructure providers (such as AWS) that
        process it on our behalf under appropriate agreements, with members of
        your own workspace, and where required by law. We never share your data
        with advertisers.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <p>
        Depending on your location, you may have the right to access, correct,
        export, or delete your personal data, and to object to or restrict
        certain processing. To exercise these rights, contact us at the address
        below.
      </p>
    ),
  },
  {
    heading: "Data retention",
    body: (
      <p>
        We retain your data for as long as your workspace is active. When you
        delete content or close your account, we remove the associated data
        within a reasonable period, except where retention is required by law.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. Material changes will be
        communicated in-app or by email, and the &ldquo;last updated&rdquo; date
        above will reflect the revision.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="May 27, 2026"
      intro="This Privacy Policy explains what information Meridian collects, how we use it, and the choices you have. It applies to the Meridian web application and marketing site."
      sections={SECTIONS}
    />
  );
}
