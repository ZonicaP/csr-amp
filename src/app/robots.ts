import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/login", "/llms.txt"],
      disallow: ["/customers", "/team", "/pay", "/profile", "/api", "/signup", "/forgot-password", "/reset-password", "/verify-email"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
