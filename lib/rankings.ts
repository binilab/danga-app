import { logDevError } from "@/lib/log";

export type RankingPeriod = "weekly" | "monthly";

export type RankingViewRow = {
  post_id: string;
  score: number;
  rank: number;
  total: number | null;
  percentile_ratio: number | null;
  badge: string | null;
};

export type RankingBadgeRow = {
  post_id: string;
  badge: string | null;
};

export type SupabaseRankingBadgeReader = {
  from: (table: "weekly_post_rankings" | "monthly_post_rankings") => {
    select: (columns: string) => {
      in: (
        column: "post_id",
        values: string[],
      ) => PromiseLike<{
        data: RankingBadgeRow[] | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
};

/**
 * URL query 문자열을 주간/월간 랭킹 타입으로 안전하게 변환합니다.
 */
export function toRankingPeriod(value: string | undefined): RankingPeriod {
  return value === "monthly" ? "monthly" : "weekly";
}

/**
 * 주간/월간 타입에 해당하는 Supabase view 이름을 반환합니다.
 */
export function getRankingViewName(period: RankingPeriod) {
  return period === "monthly" ? "monthly_post_rankings" : "weekly_post_rankings";
}

/**
 * DB badge 코드를 UI 라벨로 변환합니다.
 */
export function formatRankingBadgeLabel(badge: string | null) {
  if (badge === "TOP_1") {
    return "상위 1%";
  }

  if (badge === "TOP_10") {
    return "상위 10%";
  }

  return null;
}

/**
 * badge 값에 맞는 공통 스타일 클래스를 제공합니다.
 */
export function getRankingBadgeClass(badge: string | null) {
  if (badge === "TOP_1") {
    return "bg-amber-100 text-amber-700";
  }

  if (badge === "TOP_10") {
    return "bg-sky-100 text-sky-700";
  }

  return "bg-slate-100 text-slate-600";
}

/**
 * post_id 목록으로 랭킹 뱃지를 한 번에 조회해 매핑 맵을 반환합니다.
 */
export async function fetchRankingBadgeMapForPosts({
  supabase,
  period,
  postIds,
}: {
  supabase: SupabaseRankingBadgeReader;
  period: RankingPeriod;
  postIds: string[];
}) {
  if (postIds.length === 0) {
    return new Map<string, string | null>();
  }

  const view = getRankingViewName(period);
  const { data, error } = await supabase
    .from(view)
    .select("post_id, badge")
    .in("post_id", postIds);

  if (error) {
    logDevError("[rankings.badge] failed", { message: error.message, code: error.code });
    return new Map<string, string | null>();
  }

  return new Map((data ?? []).map((item) => [item.post_id, item.badge]));
}
