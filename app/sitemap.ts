import type { MetadataRoute } from "next";
import { blogPosts } from "../lib/blog-posts";
import { mbtiCodes } from "../lib/mbti-content";
import { newTestSlugs } from "../lib/new-tests";

export const dynamic = "force-static";

// trailingSlash: true 설정이므로 사이트맵 주소도 모두 슬래시로 끝내
// 불필요한 308 리다이렉트가 생기지 않게 합니다.
const base = "https://mbtitest.co.kr";
const url = (path: string) => `${base}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: url("/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: url("/tests/mbti/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: url("/tests/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...[
      "egen-teto",
      "adult-attachment",
      "mental-age",
      "love-language",
      "self-esteem",
      "burnout",
      "work-style",
      ...newTestSlugs,
    ].map((test) => ({
      url: url(`/tests/${test}/`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...["result", "types", "compatibility", "blog"].map((page) => ({
      url: url(`/${page}/`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...mbtiCodes.flatMap((type) => [
      {
        url: url(`/types/${type}/`),
        lastModified: new Date("2026-07-25"),
        changeFrequency: "monthly" as const,
        priority: 0.85,
      },
      {
        url: url(`/compatibility/${type}/`),
        lastModified: new Date("2026-07-25"),
        changeFrequency: "monthly" as const,
        priority: 0.82,
      },
    ]),
    ...blogPosts.map((post) => ({
      url: url(`/blog/${post.slug}/`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...["about", "contact", "privacy"].map((page) => ({
      url: url(`/${page}/`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
