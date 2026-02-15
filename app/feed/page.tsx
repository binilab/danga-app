import { PageTitle } from "@/components/PageTitle";
import { PostCard } from "@/components/PostCard";
import { feedPosts } from "@/lib/mock";

/**
 * 업로드된 코디를 카드 그리드로 보여주는 피드 페이지입니다.
 */
export default function FeedPage() {
  return (
    <div>
      <PageTitle
        title="Feed"
        description="지금 올라온 코디를 빠르게 보고, 취향에 맞는 피드를 탐색하세요."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} href={`/p/${post.id}`} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          더 보기
        </button>
      </div>
    </div>
  );
}
