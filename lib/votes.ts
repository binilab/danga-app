import { logDevError } from "@/lib/log";

export type VoteRow = {
  post_id: string;
  voter_id: string;
};

export type VoteSummary = {
  count: number;
  likedByMe: boolean;
};

export type SupabaseVotesReader = {
  from: (table: "votes") => {
    select: (columns: string) => {
      in: (
        column: "post_id",
        values: string[],
      ) => PromiseLike<{
        data: VoteRow[] | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
};

/**
 * votes 목록을 post_id 기준 집계 맵(좋아요 수/내 좋아요 여부)으로 변환합니다.
 */
export function buildVoteSummaryMap(votes: VoteRow[], viewerId: string | null) {
  const summaryMap = new Map<string, VoteSummary>();

  for (const vote of votes) {
    const prev = summaryMap.get(vote.post_id) ?? { count: 0, likedByMe: false };

    summaryMap.set(vote.post_id, {
      count: prev.count + 1,
      likedByMe: prev.likedByMe || (viewerId ? vote.voter_id === viewerId : false),
    });
  }

  return summaryMap;
}

/**
 * post_id 배열 기준으로 votes를 한 번에 조회해 집계 맵으로 반환합니다.
 */
export async function fetchVoteSummaryMapForPosts({
  supabase,
  postIds,
  viewerId,
}: {
  supabase: SupabaseVotesReader;
  postIds: string[];
  viewerId: string | null;
}) {
  if (postIds.length === 0) {
    return new Map<string, VoteSummary>();
  }

  const { data, error } = await supabase
    .from("votes")
    .select("post_id, voter_id")
    .in("post_id", postIds);

  if (error) {
    logDevError("[votes.fetch] failed", { message: error.message, code: error.code });
    return new Map<string, VoteSummary>();
  }

  return buildVoteSummaryMap(data ?? [], viewerId);
}

/**
 * 집계 맵에서 특정 post_id의 요약값을 읽고 없으면 기본값을 반환합니다.
 */
export function getVoteSummary(
  summaryMap: Map<string, VoteSummary>,
  postId: string,
): VoteSummary {
  return summaryMap.get(postId) ?? { count: 0, likedByMe: false };
}
