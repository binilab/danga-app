import { PageTitle } from "@/components/PageTitle";

/**
 * 서비스 문의/제안/신고 이슈를 접수할 수 있는 기본 연락 안내 페이지입니다.
 */
export default function ContactPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="문의하기"
        description="서비스 이용 중 불편 사항이나 제안을 전달해주세요."
      />

      <section className="danga-panel space-y-4 p-5 text-sm leading-6 text-slate-700">
        <p>
          문의 유형: 계정/로그인, 신고 처리, 게시글 노출, 버그 제보, 기타 제안.
        </p>
        <p>
          이메일:{" "}
          <a className="font-semibold text-[var(--brand)] hover:underline" href="mailto:help@danga.site">
            help@danga.site
          </a>
        </p>
        <p>운영 시간 내 순차적으로 답변드리며, 긴급한 신고 건은 관리자 화면에서 우선 처리됩니다.</p>
      </section>
    </div>
  );
}
