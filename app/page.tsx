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

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
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
