import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { PostCard } from "@/components/PostCard";
import { getPostById } from "@/lib/mock";

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 게시글 id를 받아 상세 정보를 보여주는 동적 라우트 페이지입니다.
 */
export default async function PostDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const post = getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Post #${post.id}`}
        description="코디 상세 정보와 반응 지표를 확인하는 화면입니다."
      />
      <div className="max-w-2xl">
        <PostCard post={post} />
      </div>
      <section className="danga-panel max-w-2xl p-5">
        <h2 className="text-base font-bold text-slate-900">상세 설명</h2>
        <p className="mt-2 text-sm text-slate-600">
          실제 댓글/투표/신고 기능은 이후 단계에서 연결됩니다. 현재는 라우팅과
          화면 구조를 확인하기 위한 뼈대입니다.
        </p>
      </section>
    </div>
  );
}
