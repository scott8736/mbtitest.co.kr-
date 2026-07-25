import type { MetadataRoute } from "next";
import { blogPosts } from "../lib/blog-posts";
import { newTestSlugs } from "../lib/new-tests";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mbtitest.co.kr";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/tests`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...["egen-teto", "adult-attachment", "mental-age", "love-language", "self-esteem", "burnout", "work-style", ...newTestSlugs].map((test) => ({
      url: `${base}/tests/${test}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...["result", "types", "compatibility", "blog"].map((page) => ({
      url: `${base}/${page}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...["about", "privacy"].map((page) => ({
      url: `${base}/${page}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
