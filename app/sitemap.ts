import type { MetadataRoute } from "next";

const baseUrl = "https://danga.site";

/**
 * 주요 정적 라우트를 검색 엔진에 전달하기 위한 기본 사이트맵입니다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    "/",
    "/feed",
    "/rank",
    "/me",
    "/post/new",
    "/privacy",
    "/terms",
    "/contact",
  ];

  return staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
