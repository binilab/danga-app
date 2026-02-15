import { PageTitle } from "@/components/PageTitle";

/**
 * 관리자 기능을 나중에 붙이기 위한 임시 페이지입니다.
 */
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Admin"
        description="관리자 기능은 이후 파트에서 구현됩니다. 현재는 placeholder입니다."
      />
      <section className="danga-panel p-5">
        <p className="text-sm text-slate-600">
          추후 신고 관리, 게시글 제재, 운영 통계 카드가 이 영역에 추가될
          예정입니다.
        </p>
      </section>
    </div>
  );
}
