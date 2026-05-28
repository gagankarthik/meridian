import type { ReactNode } from "react";

/* Abstract placeholder logo marks (LogoIpsum-style) — generic, colorful, and
   NOT tied to any real company. Used in the hero's orbiting chips. */
export const LOGO_MARKS: ReactNode[] = [
  // venn
  <svg key="venn" viewBox="0 0 24 24" fill="none">
    <circle cx="9.5" cy="12" r="6" fill="#2563eb" />
    <circle cx="14.5" cy="12" r="6" fill="#06b6d4" fillOpacity="0.72" />
  </svg>,
  // hexagon
  <svg key="hex" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5l8.23 4.75v9.5L12 21.5 3.77 16.75v-9.5L12 2.5z" fill="#7c3aed" />
    <path d="M12 7l4.33 2.5v5L12 17l-4.33-2.5v-5L12 7z" fill="#fff" fillOpacity="0.3" />
  </svg>,
  // rounded triangle
  <svg key="tri" viewBox="0 0 24 24" fill="none">
    <path
      d="M10.27 4.2a2 2 0 0 1 3.46 0l7.5 13A2 2 0 0 1 19.5 20h-15a2 2 0 0 1-1.73-3l7.5-13z"
      fill="#16a34a"
    />
  </svg>,
  // signal arcs
  <svg key="arc" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.4" strokeLinecap="round">
    <path d="M4.5 13a7.5 7.5 0 0 1 15 0" />
    <path d="M8 13a4 4 0 0 1 8 0" />
    <circle cx="12" cy="13" r="1.3" fill="#ea580c" stroke="none" />
  </svg>,
  // sparkle
  <svg key="spark" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2c.6 4.7 2.7 6.8 7.4 7.4-4.7.6-6.8 2.7-7.4 7.4-.6-4.7-2.7-6.8-7.4-7.4C9.3 8.8 11.4 6.7 12 2z"
      fill="#ec4899"
    />
  </svg>,
  // cube
  <svg key="cube" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l8 4.5L12 12 4 7.5 12 3z" fill="#818cf8" />
    <path d="M4 7.5L12 12v9l-8-4.5v-9z" fill="#4f46e5" />
    <path d="M20 7.5L12 12v9l8-4.5v-9z" fill="#3730a3" />
  </svg>,
  // interlocking rings
  <svg key="rings" viewBox="0 0 24 24" fill="none" strokeWidth="2.4">
    <circle cx="9.5" cy="12" r="5" stroke="#0d9488" />
    <circle cx="14.5" cy="12" r="5" stroke="#f59e0b" />
  </svg>,
  // droplet
  <svg key="drop" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5s6.5 6.4 6.5 10.5a6.5 6.5 0 1 1-13 0C5.5 8.9 12 2.5 12 2.5z" fill="#d97706" />
    <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
  </svg>,
  // pinwheel
  <svg key="pin" viewBox="0 0 24 24" fill="none">
    <path d="M12 12V3a9 9 0 0 1 9 9h-9z" fill="#8b5cf6" />
    <path d="M12 12h9a9 9 0 0 1-9 9v-9z" fill="#6d28d9" />
    <path d="M12 12v9a9 9 0 0 1-9-9h9z" fill="#a78bfa" />
    <path d="M12 12H3a9 9 0 0 1 9-9v9z" fill="#7c3aed" />
  </svg>,
];
