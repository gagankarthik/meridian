import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConfigureAmplify } from "@/components/auth/configure-amplify";
import { CookieConsent } from "@/components/cookie-consent";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const SITE_URL = "https://meridian.work";
const TITLE = "Meridian — The operating system for ambitious teams";
const DESCRIPTION =
  "Meridian is the enterprise work platform where planning, execution, and reporting live in one place. Boards, timelines, and dashboards that move at the speed of your team.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Meridian",
  },
  description: DESCRIPTION,
  applicationName: "Meridian",
  authors: [{ name: "Meridian Labs" }],
  creator: "Meridian Labs",
  publisher: "Meridian Labs",
  keywords: [
    "project management software",
    "work management platform",
    "kanban board",
    "project timeline",
    "team collaboration",
    "task tracking",
    "roadmap software",
    "agile project management",
    "enterprise work management",
  ],
  alternates: { canonical: "/" },
  category: "technology",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Meridian",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@meridian",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('meridian.prefs')||'{}');var t=p.theme||'system';var d=t==='dark'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',!!d);}catch(e){}})();`,
          }}
        />
        {/* Skip link — first focusable element (WCAG 2.4.1 Bypass Blocks) */}
        <a
          href="#main"
          className="sr-only z-[100] rounded-lg bg-ink px-4 py-2.5 text-[14px] font-bold text-paper shadow-float focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <ConfigureAmplify />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
