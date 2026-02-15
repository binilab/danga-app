import Link from "next/link";
import { feedPosts } from "@/lib/mock";

/**
 * Hero 영역에 표시할 간단한 숫자 지표를 계산합니다.
 */
function getHeroStats() {
  const postCount = feedPosts.length;
  const voteCount = feedPosts.reduce((sum, post) => sum + post.likes, 0);
  const commentCount = feedPosts.reduce((sum, post) => sum + post.comments, 0);

  return { postCount, voteCount, commentCount };
}

/**
 * 랜딩 상단에서 서비스 핵심 메시지와 주요 행동 버튼을 보여줍니다.
 */
export function Hero() {
  const { postCount, voteCount, commentCount } = getHeroStats();

  return (
    <section className="danga-panel overflow-hidden p-6 sm:p-8">
      <p className="inline-flex rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
        DANGA LANDING
      </p>
      <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
        단번에 가자
      </h1>
      <p className="mt-3 text-base font-medium text-slate-700 sm:text-lg">
        코디 올리고, 투표로 바로 평가받자.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
        고민하던 코디를 올리면 커뮤니티 반응이 바로 쌓입니다. 오늘의 감각을
        빠르게 검증하고, 취향이 맞는 사람들과 피드에서 연결되세요.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/post/new"
          className="rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white transition hover:translate-y-[-1px] hover:brightness-95"
        >
          지금 올리기
        </Link>
        <Link
          href="/feed"
          className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:translate-y-[-1px] hover:bg-slate-50"
        >
          구경하기
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center sm:max-w-xl sm:gap-3">
        <div className="rounded-2xl border border-[var(--line)] bg-slate-50 px-2 py-3">
          <p className="text-lg font-black text-slate-900">{postCount}</p>
          <p className="text-xs text-slate-500">샘플 코디</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-slate-50 px-2 py-3">
          <p className="text-lg font-black text-slate-900">{voteCount}</p>
          <p className="text-xs text-slate-500">누적 투표</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-slate-50 px-2 py-3">
          <p className="text-lg font-black text-slate-900">{commentCount}</p>
          <p className="text-xs text-slate-500">누적 댓글</p>
        </div>
      </div>
    </section>
  );
}
