import { PageTitle } from "@/components/PageTitle";
import { rankEntries } from "@/lib/mock";

/**
 * 활동 점수 기준의 사용자 랭킹을 보여주는 페이지입니다.
 */
export default function RankPage() {
  return (
    <div>
      <PageTitle
        title="Rank"
        description="좋은 코디 평가를 꾸준히 받는 사용자 순위를 확인할 수 있습니다."
      />
      <div className="danga-panel overflow-hidden">
        <ul>
          {rankEntries.map((entry) => (
            <li
              key={entry.nickname}
              className="flex items-center justify-between border-b border-[var(--line)] px-4 py-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                  {entry.rank}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    @{entry.nickname}
                  </p>
                  <p className="text-xs text-slate-500">
                    연속 활동 {entry.streakDays}일
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-[var(--brand)]">
                {entry.score.toLocaleString()}점
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
