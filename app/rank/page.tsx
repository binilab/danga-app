import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { type PostRow, toAuthorLabel } from "@/lib/posts";
import { createSignedReadUrlByKey } from "@/lib/r2";
import {
  formatRankingBadgeLabel,
  getRankingBadgeClass,
  getRankingViewName,
  type RankingViewRow,
  toRankingPeriod,
} from "@/lib/rankings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RankPageProps = {
  searchParams: Promise<{ period?: string }>;
};

type ProfileRow = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
};

/**
 * 랭킹 탭 버튼 스타일을 active 여부에 따라 계산합니다.
 */
function getTabClass(active: boolean) {
  return active
    ? "rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white"
    : "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";
}

/**
 * 작성자 표시 이름을 nickname 우선으로 만들고 없으면 user_id 일부를 사용합니다.
 */
function resolveAuthorLabel(profile: ProfileRow | undefined, userId: string) {
  if (profile?.nickname?.trim()) {
    return profile.nickname.trim();
  }

  return toAuthorLabel(userId);
}

/**
 * 랭킹 카드 썸네일 이미지를 안정적으로 표시하기 위해 서명 URL을 우선 사용합니다.
 */
async function resolveDisplayImageUrl(post: Pick<PostRow, "image_url" | "image_key">) {
  if (!post.image_key) {
    return post.image_url;
  }

  try {
    return await createSignedReadUrlByKey(post.image_key);
  } catch {
    return post.image_url;
  }
}

/**
 * 주간/월간 랭킹 Top 50을 조회해서 게시글/작성자 정보와 함께 표시합니다.
 */
export default async function RankPage({ searchParams }: RankPageProps) {
  const { period: periodQuery } = await searchParams;
  const period = toRankingPeriod(periodQuery);
  const rankingView = getRankingViewName(period);
  const supabase = await createSupabaseServerClient();

  const { data: rankingData, error: rankingError } = await supabase
    .from(rankingView)
    .select("post_id, score, rank, total, percentile_ratio, badge")
    .order("rank", { ascending: true })
    .limit(50);

  const rankingRows = (rankingData ?? []) as RankingViewRow[];
  const postIds = rankingRows.map((row) => row.post_id);

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("id, user_id, image_url, image_key, caption, tags, created_at, deleted_at")
    .in("id", postIds)
    .is("deleted_at", null);

  const posts = (postData ?? []) as PostRow[];
  const postMap = new Map(posts.map((post) => [post.id, post]));
  const userIds = Array.from(new Set(posts.map((post) => post.user_id)));

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url")
    .in("id", userIds);

  const profiles = (profileData ?? []) as ProfileRow[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const rankItems = await Promise.all(
    rankingRows.map(async (row) => {
      const post = postMap.get(row.post_id);

      if (!post) {
        return null;
      }

      const profile = profileMap.get(post.user_id);
      const badgeLabel = formatRankingBadgeLabel(row.badge);

      return {
        postId: row.post_id,
        rank: row.rank,
        score: row.score,
        badge: row.badge,
        badgeLabel,
        caption: post.caption,
        imageUrl: await resolveDisplayImageUrl(post),
        authorLabel: resolveAuthorLabel(profile, post.user_id),
        avatarUrl: profile?.avatar_url ?? null,
      };
    }),
  );

  const rows = rankItems.filter((item) => item !== null);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Rank"
        description="좋아요 반응 기준으로 계산된 주간/월간 랭킹입니다."
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/rank?period=weekly" className={getTabClass(period === "weekly")}>
          주간
        </Link>
        <Link href="/rank?period=monthly" className={getTabClass(period === "monthly")}>
          월간
        </Link>
      </div>

      {rankingError || postError ? (
        <section className="danga-panel p-5 text-sm text-rose-700">
          랭킹 데이터를 불러오지 못했습니다. 뷰/테이블 권한을 확인해주세요.
        </section>
      ) : rows.length === 0 ? (
        <section className="danga-panel p-5 text-sm text-slate-600">
          현재 표시할 랭킹 데이터가 없습니다.
        </section>
      ) : (
        <ul className="space-y-3">
          {rows.map((item) => (
            <li key={item.postId}>
              <Link
                href={`/p/${item.postId}`}
                className="danga-panel flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 sm:w-40 sm:flex-none">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                    {item.rank}
                  </span>
                  {item.badgeLabel ? (
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${getRankingBadgeClass(item.badge)}`}
                    >
                      {item.badgeLabel}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                      일반
                    </span>
                  )}
                </div>

                <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-slate-50 sm:w-28 sm:flex-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt="랭킹 게시글 썸네일"
                    className="h-24 w-full object-cover sm:h-16"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {item.caption}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>@{item.authorLabel}</span>
                    <span>·</span>
                    <span className="font-semibold text-[var(--brand)]">
                      {item.score.toLocaleString()}점
                    </span>
                  </div>
                </div>

                <div className="hidden h-8 w-8 overflow-hidden rounded-full border border-[var(--line)] bg-slate-100 sm:block">
                  {item.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.avatarUrl}
                      alt={`${item.authorLabel} 아바타`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
