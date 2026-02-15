import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * 화면 전반에서 재사용하는 기본 카드 컨테이너입니다.
 */
export function Card({ children, className }: CardProps) {
  return <section className={["danga-panel", className ?? ""].join(" ").trim()}>{children}</section>;
}

/**
 * 카드 안에서 제목/설명 텍스트 묶음을 통일된 여백으로 배치합니다.
 */
export function CardHeader({ children, className }: CardProps) {
  return <header className={["px-5 pt-5", className ?? ""].join(" ").trim()}>{children}</header>;
}

/**
 * 카드 본문 영역의 기본 패딩을 제공해 콘텐츠 가독성을 맞춥니다.
 */
export function CardBody({ children, className }: CardProps) {
  return <div className={["px-5 pb-5", className ?? ""].join(" ").trim()}>{children}</div>;
}
