import Link from "next/link";

/**
 * 랜딩 하단에서 마지막 행동 유도를 담당하는 CTA 섹션입니다.
 */
export function CTA() {
  return (
    <section className="danga-panel p-7 text-center sm:p-10">
      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">
        READY IN ONE SHOT
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
        오늘 코디가 궁금하다면,
        <br className="hidden sm:block" />
        단번에 피드에서 확인하세요.
      </h2>
      <p className="mt-3 text-sm text-slate-600 sm:text-base">
        지금 구경만 해도 DANGA의 속도를 바로 체감할 수 있습니다.
      </p>
      <Link
        href="/feed"
        className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white transition hover:translate-y-[-1px] hover:opacity-95"
      >
        피드 보기
      </Link>
    </section>
  );
}
