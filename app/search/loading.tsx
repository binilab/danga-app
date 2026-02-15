import { PageTitle } from "@/components/PageTitle";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * /search 서버 렌더링 중 표시되는 기본 로딩 화면입니다.
 */
export default function SearchLoading() {
  return (
    <div className="space-y-4">
      <PageTitle
        title="검색"
        description="검색 결과를 불러오는 중입니다."
      />
      <div className="grid danga-grid-gap sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
