import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { PostItemCard } from "@/components/post/PostItemCard";
import { ReportButton } from "@/components/report/ReportButton";
import { formatPostDate, type PostRow, toAuthorLabel } from "@/lib/posts";
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

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
};

/**
 * 게시글 레코드에서 화면에 표시할 이미지 URL을 계산합니다.
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
 * 게시글 id를 기준으로 posts 단건 + 좋아요 집계를 조회해 상세를 보여줍니다.
 */
export default async function PostDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, image_url, image_key, caption, created_at, deleted_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const post = data as PostRow;
  const displayImageUrl = await resolveDisplayImageUrl(post);
  const voteSummaryMap = await fetchVoteSummaryMapForPosts({
    supabase: supabase as unknown as SupabaseVotesReader,
    postIds: [post.id],
    viewerId: user?.id ?? null,
  });
  const voteSummary = getVoteSummary(voteSummaryMap, post.id);
  const badgeMap = await fetchRankingBadgeMapForPosts({
    supabase: supabase as unknown as SupabaseRankingBadgeReader,
    period: "weekly",
    postIds: [post.id],
  });
  const { data: commentData } = await supabase
    .from("comments")
    .select("id, post_id, user_id, body, created_at, deleted_at")
    .eq("post_id", post.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const comments = (commentData ?? []) as CommentRow[];

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Post #${post.id.slice(0, 8)}`}
        description="게시글 상세 화면입니다. 좋아요/댓글/신고를 함께 확인할 수 있습니다."
      />
      <div className="max-w-2xl">
        <PostItemCard
          id={post.id}
          imageUrl={displayImageUrl}
          caption={post.caption}
          createdAt={post.created_at}
          authorLabel={toAuthorLabel(post.user_id)}
          voteCount={voteSummary.count}
          likedByMe={voteSummary.likedByMe}
          isLoggedIn={Boolean(user)}
          badge={badgeMap.get(post.id) ?? null}
        />
        <div className="mt-3 flex justify-end">
          <ReportButton targetType="post" targetId={post.id} isLoggedIn={Boolean(user)} />
        </div>
      </div>

      <section className="max-w-2xl space-y-3">
        <h2 className="text-base font-bold text-slate-900">댓글 {comments.length}</h2>
        {comments.length === 0 ? (
          <div className="danga-panel p-4 text-sm text-slate-600">
            아직 댓글이 없습니다.
          </div>
        ) : (
          <ul className="space-y-2">
            {comments.map((comment) => (
              <li key={comment.id} className="danga-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      @{toAuthorLabel(comment.user_id)} · {formatPostDate(comment.created_at)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                      {comment.body}
                    </p>
                  </div>
                  <ReportButton
                    targetType="comment"
                    targetId={comment.id}
                    isLoggedIn={Boolean(user)}
                    className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
