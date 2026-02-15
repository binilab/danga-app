import { Skeleton } from "@/components/ui/Skeleton";

/**
 * /me 서버 데이터 로딩 중 사용자에게 보여줄 간단한 스켈레톤 UI입니다.
 */
export default function MeLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}
