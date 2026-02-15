import { PageTitle } from "@/components/PageTitle";

/**
 * 서비스 운영에 필요한 최소한의 개인정보 처리 기준을 안내합니다.
 */
export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="개인정보 처리방침"
        description="DANGA 서비스에서 수집·이용·보관하는 개인정보 처리 원칙을 안내합니다."
      />

      <section className="danga-panel space-y-4 p-5 text-sm leading-6 text-slate-700">
        <p>
          DANGA는 서비스 제공을 위해 최소한의 계정 정보와 서비스 이용 기록을 처리합니다.
          개인정보는 관련 법령에 따라 안전하게 관리하며, 목적 외로 사용하지 않습니다.
        </p>
        <p>
          수집 항목 예시: 계정 식별자, 프로필 정보, 게시글/댓글/신고 기록, 접속 로그.
        </p>
        <p>
          이용자는 언제든지 계정 정보 열람·수정·삭제를 요청할 수 있으며, 정책 변경 시 본
          페이지를 통해 고지합니다.
        </p>
      </section>
    </div>
  );
}
