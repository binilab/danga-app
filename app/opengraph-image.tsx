import { ImageResponse } from "next/og";

export const alt = "DANGA - 단번에 가자";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * 링크 공유 시 표시되는 기본 Open Graph 이미지를 동적으로 생성합니다.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(180deg, #fff7f3 0%, #f4f6f8 100%)",
          color: "#0f172a",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#ff5b2e",
          }}
        >
          DANGA
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.1 }}>단번에 가자</div>
          <div style={{ fontSize: 34, fontWeight: 500 }}>
            코디 올리고, 투표와 댓글로 바로 평가받자.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
