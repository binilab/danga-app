import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { CommentSection } from "@/components/comment/CommentSection";
import { PostCard } from "@/components/post/PostCard";
import { ReportButton } from "@/components/report/ReportButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
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

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  depth: number;
  reply_to_user_id: string | null;
  created_at: string;
  deleted_at: string | null;
  author_label?: string | null;
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
    .select("id, user_id, image_url, image_key, caption, tags, created_at, deleted_at")
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
  const { data: commentData, error: commentError } = await supabase
    .from("comments")
    .select("id, post_id, user_id, body, parent_id, depth, reply_to_user_id, created_at, deleted_at")
    .eq("post_id", post.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const commentRows = (commentData ?? []) as CommentRow[];
  const authorLabelMap = await fetchAuthorLabelMapForUserIds({
    supabase,
    userIds: [
      post.user_id,
      ...commentRows.map((comment) => comment.user_id),
      ...(user?.id ? [user.id] : []),
    ],
  });
  const postAuthorLabel = authorLabelMap.get(post.user_id) ?? "익명";
  const currentUserLabel = user?.id ? (authorLabelMap.get(user.id) ?? "익명") : null;
  const comments = commentRows.map((comment) => ({
    ...comment,
    author_label: authorLabelMap.get(comment.user_id) ?? "익명",
  }));

  return (
    <div className="space-y-6">
      <PageTitle
        title="코디 상세"
        description="한 번에 보고, 바로 반응 남기고, 댓글로 이야기해봐."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <PostCard
            id={post.id}
            imageUrl={displayImageUrl}
            caption={post.caption}
            tags={post.tags}
            createdAt={post.created_at}
            authorLabel={postAuthorLabel}
            voteCount={voteSummary.count}
            likedByMe={voteSummary.likedByMe}
            isLoggedIn={Boolean(user)}
            badge={badgeMap.get(post.id) ?? null}
          />
          <div className="flex justify-end">
            <ReportButton targetType="post" targetId={post.id} isLoggedIn={Boolean(user)} />
          </div>
        </div>

        <Card>
          <CardBody className="pt-5 space-y-3">
            <Badge tone="neutral">작성 정보</Badge>
            <p className="text-sm font-semibold text-slate-800">
              작성자 @{postAuthorLabel}
            </p>
            <p className="text-sm text-slate-600">
              게시글 ID: <span className="font-mono text-xs">{post.id.slice(0, 8)}</span>
            </p>
            <p className="text-sm text-slate-600">
              반응: 좋아요 {voteSummary.count}개
            </p>
          </CardBody>
        </Card>
      </div>

      <CommentSection
        postId={post.id}
        isLoggedIn={Boolean(user)}
        initialComments={comments}
        hasInitialLoadError={Boolean(commentError)}
        currentUserId={user?.id ?? null}
        currentUserLabel={currentUserLabel}
      />
    </div>
  );
}
