import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { PostItemCard } from "@/components/post/PostItemCard";
import { type PostRow, toAuthorLabel } from "@/lib/posts";
import { createSignedReadUrlByKey } from "@/lib/r2";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DetailPageProps = {
  params: Promise<{ id: string }>;
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
 * 게시글 id를 기준으로 posts 단건을 조회해 상세를 보여줍니다.
 */
export default async function PostDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
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

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Post #${post.id.slice(0, 8)}`}
        description="게시글 상세 화면입니다. 이후 파트에서 투표/댓글 기능이 연결됩니다."
      />
      <div className="max-w-2xl">
        <PostItemCard
          id={post.id}
          imageUrl={displayImageUrl}
          caption={post.caption}
          createdAt={post.created_at}
          authorLabel={toAuthorLabel(post.user_id)}
        />
      </div>
    </div>
  );
}
