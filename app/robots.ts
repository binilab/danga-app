import type { MetadataRoute } from "next";

/**
 * 검색 엔진 크롤러에 공개 경로/차단 경로를 전달하는 robots 설정입니다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: "https://danga.site/sitemap.xml",
  };
}
