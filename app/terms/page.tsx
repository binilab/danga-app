import { PageTitle } from "@/components/PageTitle";

/**
 * 서비스 이용 시 사용자와 운영자가 지켜야 할 기본 약관을 안내합니다.
 */
export default function TermsPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="이용약관"
        description="DANGA 서비스 이용을 위한 기본 약관입니다."
      />

      <section className="danga-panel space-y-4 p-5 text-sm leading-6 text-slate-700">
        <p>
          사용자는 관련 법령과 커뮤니티 가이드를 준수해야 하며, 타인에게 피해를 주는
          콘텐츠를 등록해서는 안 됩니다.
        </p>
        <p>
          운영자는 신고/검토 절차를 통해 서비스 품질을 유지할 수 있으며, 약관 위반 콘텐츠는
          노출 제한 또는 삭제될 수 있습니다.
        </p>
        <p>
          본 약관은 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 사전에 안내됩니다.
        </p>
      </section>
    </div>
  );
}
