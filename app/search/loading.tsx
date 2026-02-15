import { PageTitle } from "@/components/PageTitle";

/**
 * /search 서버 렌더링 중 표시되는 기본 로딩 화면입니다.
 */
export default function SearchLoading() {
  return (
    <div className="space-y-4">
      <PageTitle
        title="Search"
        description="검색 결과를 불러오는 중입니다."
      />
      <section className="danga-panel p-5 text-sm text-slate-600">
        검색 결과를 준비하고 있습니다...
      </section>
    </div>
  );
}
