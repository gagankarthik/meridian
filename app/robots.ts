import type { MetadataRoute } from "next";

const SITE_URL = "https://meridian.work";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The authenticated product and auth flows shouldn't be indexed.
      disallow: ["/app", "/app/", "/login", "/signup", "/onboarding", "/reset-password", "/forgot-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
