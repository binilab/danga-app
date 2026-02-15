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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeTagQueryValue } from "@/lib/tags";
import {
  fetchVoteSummaryMapForPosts,
  getVoteSummary,
  type SupabaseVotesReader,
} from "@/lib/votes";

const PAGE_SIZE = 20;

type SearchPageProps = {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
};

/**
 * URL query의 page 값을 1 이상의 정수로 안전하게 변환합니다.
 */
function toPage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

/**
 * keyword query를 trim하고 과도하게 긴 입력은 잘라서 검색 안정성을 높입니다.
 */
function normalizeKeyword(value: string | undefined) {
  const keyword = value?.trim() ?? "";

  if (!keyword) {
    return "";
  }

  return keyword.slice(0, 100);
}

/**
 * 페이지 기반 조회에서 필요한 range(from, to)를 계산합니다.
 */
function toRange(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  return { from, to };
}

/**
 * 검색 더보기 링크를 만들기 위해 q/tag/page를 query string으로 직렬화합니다.
 */
function buildSearchHref({
  q,
  tag,
  page,
}: {
  q: string;
  tag: string | null;
  page: number;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (tag) {
    params.set("tag", tag);
  }

  params.set("page", String(page));

  return `/search?${params.toString()}`;
}

/**
 * image_key가 있는 게시글은 서명 URL을 우선 사용해 안정적인 미리보기를 만듭니다.
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
 * /search 페이지에서 키워드/태그 조합으로 posts를 조회해 카드 목록으로 렌더링합니다.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: qQuery, tag: tagQuery, page: pageQuery } = await searchParams;
  const q = normalizeKeyword(qQuery);
  const tag = normalizeTagQueryValue(tagQuery);
  const page = toPage(pageQuery);
  const { from, to } = toRange(page);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let query = supabase
    .from("posts")
    .select("id, user_id, image_url, image_key, caption, tags, created_at, deleted_at")
    .is("deleted_at", null);

  if (q) {
    query = query.ilike("caption", `%${q}%`);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query
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
    <div className="space-y-6">
      <PageTitle
        title="검색"
        description="원하는 코디를 한 번에 찾아봐. 키워드와 태그를 같이 써도 돼."
      />

      <SearchForm defaultQuery={q} activeTag={tag} />

      {error ? (
        <ErrorState
          title="검색 결과를 불러오지 못했어요."
          description="잠시 후 다시 시도해줘."
        />
      ) : cards.length === 0 ? (
        <EmptyState
          title="조건에 맞는 코디가 없어요."
          description="검색어를 바꾸거나 태그 필터를 해제해봐."
          action={<ButtonLink href="/feed" variant="secondary">피드 보기</ButtonLink>}
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
        <div className="flex justify-center">
          <ButtonLink href={buildSearchHref({ q, tag, page: page + 1 })} variant="secondary">
            더 보기
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
