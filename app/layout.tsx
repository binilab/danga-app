import { Suspense } from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const siteName = "DANGA";
const siteTitle = "DANGA | 단번에 가자, 나이스 패션이다";
const siteDescription = "코디를 올리고, 투표와 댓글로 바로 평가받는 패션 커뮤니티 DANGA";

export const metadata: Metadata = {
  metadataBase: new URL("https://danga.site"),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: "https://danga.site",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DANGA - 단번에 가자",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/twitter-image"],
  },
};

/**
 * Header가 로딩되는 동안 레이아웃 높이가 흔들리지 않도록 임시 헤더 영역을 렌더링합니다.
 */
function HeaderFallback() {
  return <div className="h-[76px] border-b border-[var(--line)] bg-white/92" />;
}

/**
 * 앱 전체의 공통 틀(헤더/본문 여백/기본 메타 정보)을 설정하는 루트 레이아웃입니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">
        <div className="relative min-h-screen">
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
            <main>{children}</main>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
