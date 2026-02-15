import Link from "next/link";
import { formatPostDate } from "@/lib/posts";

export type MyLikeItem = {
  postId: string;
  postCaption: string;
  postImageUrl: string;
  postAuthorLabel: string;
  likedAt: string;
};

type MyLikesProps = {
  items: MyLikeItem[];
};

/**
 * "내 좋아요" 탭에서 사용자가 좋아요를 누른 게시글 목록을 보여줍니다.
 */
export function MyLikes({ items }: MyLikesProps) {
  if (items.length === 0) {
    return (
      <section className="danga-panel p-5 text-sm text-slate-600">
        아직 좋아요한 게시글이 없습니다. 피드에서 마음에 드는 코디를 눌러보세요.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {items.map((item) => (
        <article key={`${item.postId}-${item.likedAt}`} className="danga-panel p-4">
          <div className="flex items-start gap-3">
            <Link
              href={`/p/${item.postId}`}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.postImageUrl}
                alt="좋아요한 게시글 썸네일"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-rose-600">
                ♥ {formatPostDate(item.likedAt)}에 좋아요
              </p>
              <p className="mt-1 text-xs text-slate-500">@{item.postAuthorLabel}</p>
              <Link href={`/p/${item.postId}`} className="mt-1 block">
                <p className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-slate-950">
                  {item.postCaption}
                </p>
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
