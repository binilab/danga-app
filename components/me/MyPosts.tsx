import { PostItemCard } from "@/components/post/PostItemCard";

export type MyPostItem = {
  id: string;
  imageUrl: string;
  caption: string;
  tags: string[] | null;
  createdAt: string;
  authorLabel: string;
  voteCount: number;
  likedByMe: boolean;
  badge: string | null;
};

type MyPostsProps = {
  items: MyPostItem[];
  isLoggedIn: boolean;
};

/**
 * "내 글" 탭에서 내 게시글 목록을 카드 그리드 형태로 보여줍니다.
 */
export function MyPosts({ items, isLoggedIn }: MyPostsProps) {
  if (items.length === 0) {
    return (
      <section className="danga-panel p-5 text-sm text-slate-600">
        아직 작성한 게시글이 없습니다. 첫 코디를 올려보세요.
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <PostItemCard
          key={item.id}
          id={item.id}
          href={`/p/${item.id}`}
          imageUrl={item.imageUrl}
          caption={item.caption}
          tags={item.tags}
          createdAt={item.createdAt}
          authorLabel={item.authorLabel}
          voteCount={item.voteCount}
          likedByMe={item.likedByMe}
          isLoggedIn={isLoggedIn}
          badge={item.badge}
        />
      ))}
    </section>
  );
}
