import { SiteNav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { Features } from "@/components/marketing/features";
import { UseCases } from "@/components/marketing/use-cases";
import { WorkflowSection } from "@/components/marketing/workflow";
import { Views } from "@/components/marketing/views";
import { Metrics } from "@/components/marketing/metrics";
import { Testimonials } from "@/components/marketing/testimonials";
import { Security } from "@/components/marketing/security";
import { CTA } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://meridian.work/#org",
      name: "Meridian",
      url: "https://meridian.work",
      logo: "https://meridian.work/icon.svg",
      description:
        "The enterprise work platform where planning, execution, and reporting live in one place.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://meridian.work/#website",
      url: "https://meridian.work",
      name: "Meridian",
      publisher: { "@id": "https://meridian.work/#org" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Meridian",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Boards, timelines, dashboards, and approvals on one source of truth for teams that ship.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to start",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <SiteNav />
      <main>
        <Hero />
        <LogoMarquee />
        <Features />
        <UseCases />
        <WorkflowSection />
        <Views />
        <Metrics />
        <Testimonials />
        <Security />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
