import Link from "next/link";
import { weeklyTopRankers } from "@/lib/mock";

/**
 * 순위 변동 상태를 텍스트로 변환합니다.
 */
function getTrendLabel(trend: "up" | "same" | "down"): string {
  if (trend === "up") {
    return "상승";
  }

  if (trend === "down") {
    return "하락";
  }

  return "유지";
}

/**
 * 주간 랭킹 Top 10 미리보기를 보여주는 섹션입니다.
 */
export function RankPreview() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Rank preview
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            이번 주 Top 10과 상위권 배지 예시를 확인해보세요.
          </p>
        </div>
        <Link
          href="/rank"
          className="hidden text-sm font-semibold text-[var(--brand)] sm:inline"
        >
          랭킹 전체 보기
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="danga-panel overflow-hidden">
          <ul>
            {weeklyTopRankers.map((entry) => (
              <li
                key={entry.rank}
                className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                    {entry.rank}
                  </span>
                  <p className="text-sm font-bold text-slate-900">@{entry.nickname}</p>
                  {entry.topPercent ? (
                    <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand)]">
                      상위 1%
                    </span>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">
                    {entry.score.toLocaleString()}점
                  </p>
                  <p className="text-xs text-slate-500">{getTrendLabel(entry.trend)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="danga-panel p-5">
          <p className="text-xs font-semibold text-slate-500">BADGE EXAMPLE</p>
          <div className="mt-3 inline-flex items-center rounded-full bg-[var(--foreground)] px-3 py-1 text-xs font-bold text-white">
            상위 1%
          </div>
          <h3 className="mt-3 text-base font-black text-slate-900">Top Performer</h3>
          <p className="mt-2 text-sm text-slate-600">
            이번 주 점수 기준 상위 1%에 진입하면 프로필에 배지가 노출됩니다.
          </p>
          <Link
            href="/rank"
            className="mt-4 inline-block rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            랭킹 보러가기
          </Link>
        </aside>
      </div>

      <Link href="/rank" className="inline-block text-sm font-semibold text-[var(--brand)] sm:hidden">
        랭킹 전체 보기
      </Link>
    </section>
  );
}
