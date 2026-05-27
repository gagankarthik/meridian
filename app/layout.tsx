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

export const metadata: Metadata = {
  metadataBase: new URL("https://meridian.work"),
  title: {
    default: "Meridian — The operating system for ambitious teams",
    template: "%s · Meridian",
  },
  description:
    "Meridian is the enterprise work platform where planning, execution, and reporting live in one place. Boards, timelines, and dashboards that move at the speed of your team.",
  keywords: [
    "project management",
    "work management",
    "enterprise",
    "kanban",
    "timeline",
    "team collaboration",
  ],
  openGraph: {
    title: "Meridian — The operating system for ambitious teams",
    description:
      "The enterprise work platform where planning, execution, and reporting live in one place.",
    type: "website",
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
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('meridian.prefs')||'{}');var t=p.theme||'system';var d=t==='dark'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',!!d);}catch(e){}})();`,
          }}
        />
        <ConfigureAmplify />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
