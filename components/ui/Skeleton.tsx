type SkeletonProps = {
  className?: string;
};

/**
 * 로딩 중 자리 차지를 유지해 레이아웃 점프를 줄이는 기본 스켈레톤 블록입니다.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-[var(--radius-md)] bg-slate-200/80",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
