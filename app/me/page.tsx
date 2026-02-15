import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { PageTitle } from "@/components/PageTitle";
import { MyPosts, type MyPostItem } from "@/components/me/MyPosts";
import { MyLikes, type MyLikeItem } from "@/components/me/MyLikes";
import { MyComments, type MyCommentItem } from "@/components/me/MyComments";
import { ProfileEditor } from "@/components/me/ProfileEditor";
import { AccountDangerZone } from "@/components/me/AccountDangerZone";
import { type PostRow, toAuthorLabel } from "@/lib/posts";
import { createSignedReadUrlByKey } from "@/lib/r2";
import {
  fetchVoteSummaryMapForPosts,
  getVoteSummary,
  type SupabaseVotesReader,
} from "@/lib/votes";
import {
  fetchRankingBadgeMapForPosts,
  type SupabaseRankingBadgeReader,
} from "@/lib/rankings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MY_POST_PAGE_SIZE = 20;
const MY_ACTIVITY_LIMIT = 50;

type MeTab = "posts" | "likes" | "comments";

type MePageProps = {
  searchParams: Promise<{ tab?: string; page?: string }>;
};

type ProfileRow = {
  nickname: string | null;
  avatar_url: string | null;
  deleted_at: string | null;
};

type VoteActivityRow = {
  post_id: string;
  created_at: string;
};

type CommentActivityRow = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
};

const meTabs: { id: MeTab; label: string }[] = [
  { id: "posts", label: "내 글" },
  { id: "likes", label: "내 좋아요" },
  { id: "comments", label: "내 댓글" },
];

/**
 * URL query 문자열을 /me 탭 키로 안전하게 변환합니다.
 */
function toMeTab(value: string | undefined): MeTab {
  if (value === "likes") {
    return "likes";
  }

  if (value === "comments") {
    return "comments";
  }

  return "posts";
}

/**
 * posts 탭 페이징용 page 값을 1 이상의 정수로 변환합니다.
 */
function toPage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

/**
 * range 조회에서 더보기 여부를 판단할 수 있도록 +1 범위를 계산합니다.
 */
function toRange(page: number) {
  const from = (page - 1) * MY_POST_PAGE_SIZE;
  const to = from + MY_POST_PAGE_SIZE;

  return { from, to };
}

/**
 * 로그인 사용자 메타데이터를 기반으로 닉네임 기본값을 계산합니다.
 */
function resolveFallbackNickname(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const nameKeys = ["nickname", "user_name", "full_name", "name"];

  if (metadata) {
    for (const key of nameKeys) {
      const value = metadata[key];

      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  if (user.email) {
    return user.email.split("@")[0] ?? "danga_user";
  }

  return "danga_user";
}

/**
 * image_key가 있는 게시글은 서명 URL을 우선 사용해 미리보기를 안정적으로 만듭니다.
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
 * 동일한 게시글 목록에 대해 한 번에 표시용 이미지 URL 맵을 구성합니다.
 */
async function buildDisplayImageMap(posts: PostRow[]) {
  const entries = await Promise.all(
    posts.map(async (post) => [post.id, await resolveDisplayImageUrl(post)] as const),
  );

  return new Map(entries);
}

/**
 * "내 글" 탭의 posts/votes/badge 데이터를 모아서 카드 렌더링용 형태로 변환합니다.
 */
async function fetchMyPostsData({
  supabase,
  userId,
  page,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  page: number;
}) {
  const { from, to } = toRange(page);
  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, image_url, image_key, caption, tags, created_at, deleted_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { items: [] as MyPostItem[], hasMore: false, hasError: true };
  }

  const rows = (data ?? []) as PostRow[];
  const hasMore = rows.length > MY_POST_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, MY_POST_PAGE_SIZE) : rows;
  const postIds = items.map((post) => post.id);
  const voteSummaryMap = await fetchVoteSummaryMapForPosts({
    supabase: supabase as unknown as SupabaseVotesReader,
    postIds,
    viewerId: userId,
  });
  const badgeMap = await fetchRankingBadgeMapForPosts({
    supabase: supabase as unknown as SupabaseRankingBadgeReader,
    period: "weekly",
    postIds,
  });
  const displayImageMap = await buildDisplayImageMap(items);

  return {
    items: items.map((post) => {
      const voteSummary = getVoteSummary(voteSummaryMap, post.id);

      return {
        id: post.id,
        imageUrl: displayImageMap.get(post.id) ?? post.image_url,
        caption: post.caption,
        tags: post.tags,
        createdAt: post.created_at,
        authorLabel: toAuthorLabel(post.user_id),
        voteCount: voteSummary.count,
        likedByMe: voteSummary.likedByMe,
        badge: badgeMap.get(post.id) ?? null,
      } satisfies MyPostItem;
    }),
    hasMore,
    hasError: false,
  };
}

/**
 * "내 좋아요" 탭에서 votes를 먼저 읽고 posts를 in()으로 한 번에 붙여 목록을 만듭니다.
 */
async function fetchMyLikesData({
  supabase,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
}) {
  const { data: voteData, error: voteError } = await supabase
    .from("votes")
    .select("post_id, created_at")
    .eq("voter_id", userId)
    .order("created_at", { ascending: false })
    .limit(MY_ACTIVITY_LIMIT);

  if (voteError) {
    return { items: [] as MyLikeItem[], hasError: true };
  }

  const votes = (voteData ?? []) as VoteActivityRow[];
  const postIds = votes.map((vote) => vote.post_id);

  if (postIds.length === 0) {
    return { items: [] as MyLikeItem[], hasError: false };
  }

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("id, user_id, image_url, image_key, caption, tags, created_at, deleted_at")
    .in("id", postIds)
    .is("deleted_at", null);

  if (postError) {
    return { items: [] as MyLikeItem[], hasError: true };
  }

  const posts = (postData ?? []) as PostRow[];
  const postMap = new Map(posts.map((post) => [post.id, post]));
  const displayImageMap = await buildDisplayImageMap(posts);

  return {
    items: votes
      .map((vote) => {
        const post = postMap.get(vote.post_id);

        if (!post) {
          return null;
        }

        return {
          postId: post.id,
          postCaption: post.caption,
          postImageUrl: displayImageMap.get(post.id) ?? post.image_url,
          postAuthorLabel: toAuthorLabel(post.user_id),
          likedAt: vote.created_at,
        } satisfies MyLikeItem;
      })
      .filter((item): item is MyLikeItem => item !== null),
    hasError: false,
  };
}

/**
 * "내 댓글" 탭에서 comments를 읽고 post_id 기준으로 게시글 정보를 일괄 결합합니다.
 */
async function fetchMyCommentsData({
  supabase,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
}) {
  const { data: commentData, error: commentError } = await supabase
    .from("comments")
    .select("id, post_id, body, created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(MY_ACTIVITY_LIMIT);

  if (commentError) {
    return { items: [] as MyCommentItem[], hasError: true };
  }

  const comments = (commentData ?? []) as CommentActivityRow[];
  const postIds = [...new Set(comments.map((comment) => comment.post_id))];

  if (postIds.length === 0) {
    return { items: [] as MyCommentItem[], hasError: false };
  }

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("id, user_id, image_url, image_key, caption, tags, created_at, deleted_at")
    .in("id", postIds)
    .is("deleted_at", null);

  if (postError) {
    return { items: [] as MyCommentItem[], hasError: true };
  }

  const posts = (postData ?? []) as PostRow[];
  const postMap = new Map(posts.map((post) => [post.id, post]));
  const displayImageMap = await buildDisplayImageMap(posts);

  return {
    items: comments.map((comment) => {
      const post = postMap.get(comment.post_id);

      return {
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
        postId: comment.post_id,
        postCaption: post?.caption ?? null,
        postImageUrl: post ? (displayImageMap.get(post.id) ?? post.image_url) : null,
      } satisfies MyCommentItem;
    }),
    hasError: false,
  };
}

/**
 * /me 페이지에서 내 글/좋아요/댓글 조회, 프로필 편집, 계정 탈퇴 기능을 제공합니다.
 */
export default async function MePage({ searchParams }: MePageProps) {
  const { tab: tabQuery, page: pageQuery } = await searchParams;
  const activeTab = toMeTab(tabQuery);
  const page = toPage(pageQuery);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="My Page"
          description="내 글/좋아요/댓글과 프로필을 관리하는 공간입니다."
        />
        <section className="danga-panel p-5 text-sm text-slate-600">
          로그인이 필요합니다. 헤더의 <span className="font-semibold">시작하기</span>{" "}
          버튼으로 로그인 후 다시 시도해주세요.
        </section>
      </div>
    );
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("nickname, avatar_url, deleted_at")
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileData as ProfileRow | null) ?? null;
  const fallbackNickname = resolveFallbackNickname(user);
  const profileNickname = profile?.nickname ?? fallbackNickname;
  const profileAvatarUrl = profile?.avatar_url ?? null;
  const isDeletedProfile = Boolean(profile?.deleted_at);
  const tabBaseHref = "/me";

  const myPostsResult =
    activeTab === "posts"
      ? await fetchMyPostsData({
          supabase,
          userId: user.id,
          page,
        })
      : null;
  const myLikesResult =
    activeTab === "likes"
      ? await fetchMyLikesData({
          supabase,
          userId: user.id,
        })
      : null;
  const myCommentsResult =
    activeTab === "comments"
      ? await fetchMyCommentsData({
          supabase,
          userId: user.id,
        })
      : null;

  return (
    <div className="space-y-6">
      <PageTitle
        title="My Page"
        description="내 활동을 한 곳에서 관리하세요. 프로필 수정과 계정 탈퇴도 여기서 처리할 수 있습니다."
      />

      {profileError ? (
        <section className="danga-panel p-4 text-sm text-rose-700">
          프로필을 불러오지 못했습니다. 잠시 후 새로고침 해주세요.
        </section>
      ) : null}

      {isDeletedProfile ? (
        <section className="danga-panel p-4 text-sm text-amber-800">
          현재 계정은 탈퇴 처리된 상태입니다. 필요한 데이터 확인 후 로그아웃해주세요.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="danga-panel space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">내 활동</p>
                <p className="text-lg font-bold text-slate-900">@{profileNickname}</p>
              </div>
              <Link
                href="/post/new"
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                새 코디 올리기
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {meTabs.map((tab) => {
                const href = `${tabBaseHref}?tab=${tab.id}`;
                const isActive = activeTab === tab.id;

                return (
                  <Link
                    key={tab.id}
                    href={href}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                        : "border-[var(--line)] bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {activeTab === "posts" ? (
            <>
              {myPostsResult?.hasError ? (
                <section className="danga-panel p-5 text-sm text-rose-700">
                  내 게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                </section>
              ) : (
                <MyPosts items={myPostsResult?.items ?? []} isLoggedIn />
              )}
              {myPostsResult?.hasMore ? (
                <div className="flex justify-center">
                  <Link
                    href={`${tabBaseHref}?tab=posts&page=${page + 1}`}
                    className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    더보기
                  </Link>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === "likes" ? (
            myLikesResult?.hasError ? (
              <section className="danga-panel p-5 text-sm text-rose-700">
                내 좋아요 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </section>
            ) : (
              <MyLikes items={myLikesResult?.items ?? []} />
            )
          ) : null}

          {activeTab === "comments" ? (
            myCommentsResult?.hasError ? (
              <section className="danga-panel p-5 text-sm text-rose-700">
                내 댓글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </section>
            ) : (
              <MyComments items={myCommentsResult?.items ?? []} />
            )
          ) : null}
        </div>

        <aside className="space-y-4">
          <ProfileEditor
            userId={user.id}
            initialNickname={profileNickname}
            initialAvatarUrl={profileAvatarUrl}
          />
          <AccountDangerZone userId={user.id} />
        </aside>
      </section>
    </div>
  );
}
