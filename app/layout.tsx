import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "DANGA | 단번에 가자, 나이스 패션이다",
  description: "패션 평가 커뮤니티 DANGA(danga.site) Part 1 뼈대",
};

/**
 * Header가 로딩되는 동안 레이아웃 높이가 흔들리지 않도록 임시 헤더 영역을 렌더링합니다.
 */
function HeaderFallback() {
  return <div className="h-[73px] border-b border-[var(--line)] bg-white/92" />;
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
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
