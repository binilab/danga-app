import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";

/**
 * 로그인 연동 전 단계에서 마이페이지 구조만 보여주는 플레이스홀더입니다.
 */
export default function MePage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="My Page"
        description="내 활동 기록과 올린 코디를 관리하는 공간입니다. (현재는 뼈대 단계)"
      />

      <section className="danga-panel p-5">
        <h2 className="text-base font-bold text-slate-900">내 프로필 요약</h2>
        <p className="mt-2 text-sm text-slate-600">
          로그인/프로필 연동은 이후 파트에서 연결됩니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            게시글 0
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            총 좋아요 0
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            평균 점수 0
          </span>
        </div>
      </section>

      <section className="danga-panel p-5">
        <h2 className="text-base font-bold text-slate-900">빠른 이동</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/post/new"
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
          >
            새 코디 올리기
          </Link>
          <Link
            href="/feed"
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-700"
          >
            피드 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
