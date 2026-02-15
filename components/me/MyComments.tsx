import Link from "next/link";
import { formatPostDate } from "@/lib/posts";

export type MyCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  postId: string;
  postCaption: string | null;
  postImageUrl: string | null;
};

type MyCommentsProps = {
  items: MyCommentItem[];
};

/**
 * "내 댓글" 탭에서 내가 남긴 댓글과 연결된 게시글 정보를 함께 보여줍니다.
 */
export function MyComments({ items }: MyCommentsProps) {
  if (items.length === 0) {
    return (
      <section className="danga-panel p-5 text-sm text-slate-600">
        아직 작성한 댓글이 없습니다. 게시글에 의견을 남겨보세요.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="danga-panel p-4">
          <p className="text-xs text-slate-500">{formatPostDate(item.createdAt)}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.body}</p>

          <div className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--line)] bg-slate-50 p-2.5">
            {item.postImageUrl ? (
              <Link
                href={`/p/${item.postId}`}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-[var(--line)] bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.postImageUrl}
                  alt="댓글이 달린 게시글 썸네일"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </Link>
            ) : null}
            <div className="min-w-0 flex-1">
              <Link href={`/p/${item.postId}`}>
                <p className="line-clamp-1 text-xs font-semibold text-slate-600">원문 보기</p>
                <p className="line-clamp-2 text-sm font-medium text-slate-800 hover:text-slate-950">
                  {item.postCaption ?? "삭제되었거나 접근할 수 없는 게시글입니다."}
                </p>
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
