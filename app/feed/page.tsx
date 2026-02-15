import { PageTitle } from "@/components/PageTitle";
import { PostCard } from "@/components/post/PostCard";
import { SearchForm } from "@/components/search/SearchForm";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/State";
import { fetchAuthorLabelMapForUserIds, type PostRow } from "@/lib/posts";
import { createSignedReadUrlByKey } from "@/lib/r2";
import {
  fetchRankingBadgeMapForPosts,
  type SupabaseRankingBadgeReader,
} from "@/lib/rankings";
import {
  fetchVoteSummaryMapForPosts,
  getVoteSummary,
  type SupabaseVotesReader,
} from "@/lib/votes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

type FeedPageProps = {
  searchParams: Promise<{ page?: string }>;
};

/**
 * URL query의 page 값을 안전한 숫자(1 이상)로 변환합니다.
 */
function toPage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

/**
 * 게시글 목록을 불러올 때 필요한 페이지 범위를 계산합니다.
 */
function toRange(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  return { from, to };
}

/**
 * 이미지 key가 있으면 서명 URL을 우선 사용해 안정적인 미리보기를 만듭니다.
 */
async function resolveDisplayImageUrl(post: PostRow) {
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
 * 최신순 게시글과 좋아요/주간뱃지를 페이지 단위로 조회해 렌더링합니다.
 */
export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { page: pageQuery } = await searchParams;
  const page = toPage(pageQuery);
  const { from, to } = toRange(page);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, image_url, image_key, caption, tags, created_at, deleted_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = (data ?? []) as PostRow[];
  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const postIds = items.map((post) => post.id);
  const authorLabelMap = await fetchAuthorLabelMapForUserIds({
    supabase,
    userIds: items.map((post) => post.user_id),
  });
  const voteSummaryMap = await fetchVoteSummaryMapForPosts({
    supabase: supabase as unknown as SupabaseVotesReader,
    postIds,
    viewerId: user?.id ?? null,
  });
  const weeklyBadgeMap = await fetchRankingBadgeMapForPosts({
    supabase: supabase as unknown as SupabaseRankingBadgeReader,
    period: "weekly",
    postIds,
  });

  const cards = await Promise.all(
    items.map(async (post) => {
      const voteSummary = getVoteSummary(voteSummaryMap, post.id);

      return {
        ...post,
        displayImageUrl: await resolveDisplayImageUrl(post),
        authorLabel: authorLabelMap.get(post.user_id) ?? "익명",
        voteCount: voteSummary.count,
        likedByMe: voteSummary.likedByMe,
        badge: weeklyBadgeMap.get(post.id) ?? null,
      };
    }),
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="피드"
        description="지금 올라온 코디를 바로 보고, 마음에 들면 반응을 남겨줘."
      />
      <SearchForm />

      {error ? (
        <ErrorState
          title="피드를 불러오지 못했어요."
          description="잠시 후 다시 시도해줘."
        />
      ) : cards.length === 0 ? (
        <EmptyState
          title="아직 코디가 없어요."
          description="첫 코디를 올리고 피드를 시작해봐."
          action={<ButtonLink href="/post/new">코디 올리기</ButtonLink>}
        />
      ) : (
        <div className="grid danga-grid-gap sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              href={`/p/${post.id}`}
              imageUrl={post.displayImageUrl}
              caption={post.caption}
              tags={post.tags}
              createdAt={post.created_at}
              authorLabel={post.authorLabel}
              voteCount={post.voteCount}
              likedByMe={post.likedByMe}
              isLoggedIn={Boolean(user)}
              badge={post.badge}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-2 flex justify-center">
          <ButtonLink href={`/feed?page=${page + 1}`} variant="secondary">
            더 보기
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
