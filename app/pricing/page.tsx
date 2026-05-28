import type { Metadata } from "next";
import { SiteNav } from "@/components/marketing/nav";
import { Pricing } from "@/components/marketing/pricing";
import { CTA } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of every size.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteNav />
      <main id="main" tabIndex={-1} className="pt-16 outline-none">
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
