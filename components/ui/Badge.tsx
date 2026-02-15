import type { ReactNode } from "react";

type BadgeTone = "neutral" | "brand" | "success" | "danger";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

/**
 * 짧은 상태/태그 텍스트를 칩 형태로 표시하는 공통 배지 컴포넌트입니다.
 */
export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  const toneClass =
    tone === "brand"
      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
      : tone === "success"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "danger"
          ? "bg-rose-50 text-rose-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClass,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
