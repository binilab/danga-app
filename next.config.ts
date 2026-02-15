import type { NextConfig } from "next";

/**
 * 환경 변수 URL에서 이미지 호스트를 추출합니다.
 */
function getHostNameFromUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

const publicImageHost = getHostNameFromUrl(process.env.R2_PUBLIC_BASE_URL);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.danga.site",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      ...(publicImageHost
        ? [
            {
              protocol: "https" as const,
              hostname: publicImageHost,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
