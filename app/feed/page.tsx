import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { PostItemCard } from "@/components/post/PostItemCard";
import { type PostRow, toAuthorLabel } from "@/lib/posts";
import { createSignedReadUrlByKey } from "@/lib/r2";
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
 * 최신순 게시글과 좋아요 집계를 페이지 단위로 조회해 렌더링합니다.
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
    .select("id, user_id, image_url, image_key, caption, created_at, deleted_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = (data ?? []) as PostRow[];
  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const postIds = items.map((post) => post.id);
  const voteSummaryMap = await fetchVoteSummaryMapForPosts({
    supabase: supabase as unknown as SupabaseVotesReader,
    postIds,
    viewerId: user?.id ?? null,
  });

  const cards = await Promise.all(
    items.map(async (post) => {
      const voteSummary = getVoteSummary(voteSummaryMap, post.id);

      return {
        ...post,
        displayImageUrl: await resolveDisplayImageUrl(post),
        authorLabel: toAuthorLabel(post.user_id),
        voteCount: voteSummary.count,
        likedByMe: voteSummary.likedByMe,
      };
    }),
  );

  return (
    <div>
      <PageTitle
        title="Feed"
        description="최신순으로 올라온 코디를 확인하고, 마음에 드는 스타일을 둘러보세요."
      />

      {error ? (
        <section className="danga-panel p-5 text-sm text-rose-700">
          피드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </section>
      ) : cards.length === 0 ? (
        <section className="danga-panel p-5 text-sm text-slate-600">
          아직 게시글이 없습니다. 첫 게시글을 올려보세요.
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((post) => (
            <PostItemCard
              key={post.id}
              id={post.id}
              href={`/p/${post.id}`}
              imageUrl={post.displayImageUrl}
              caption={post.caption}
              createdAt={post.created_at}
              authorLabel={post.authorLabel}
              voteCount={post.voteCount}
              likedByMe={post.likedByMe}
              isLoggedIn={Boolean(user)}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Link
            href={`/feed?page=${page + 1}`}
            className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            더보기
          </Link>
        </div>
      ) : null}
    </div>
  );
}
