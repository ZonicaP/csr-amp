import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/login", siteUrl()).toString(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
