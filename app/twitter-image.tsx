import { ImageResponse } from "next/og";

export const alt = "DANGA - 단번에 가자";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

/**
 * Twitter(X) 공유 미리보기용 기본 이미지를 동적으로 생성합니다.
 */
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "#f4f6f8",
          color: "#0f172a",
          padding: "56px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Pretendard, Noto Sans KR, sans-serif",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: "#ff5b2e" }}>DANGA</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>단번에 가자</div>
          <div style={{ fontSize: 30, fontWeight: 500 }}>
            코디 올리고, 투표로 바로 평가받는 패션 커뮤니티
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
