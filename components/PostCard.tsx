import Link from "next/link";
import type { MockPost } from "@/lib/mock";

type PostCardProps = {
  post: MockPost;
  href?: string;
  compact?: boolean;
};

/**
 * 게시글 카드 내부의 핵심 정보(태그/제목/메타)를 화면에 표시합니다.
 */
function PostCardContent({ post, compact = false }: PostCardProps) {
  return (
    <>
      <div
        className={`flex w-full items-end rounded-xl bg-gradient-to-br from-slate-100 via-white to-[var(--brand-soft)] p-3 text-xs font-medium text-slate-600 ${
          compact ? "h-28" : "h-36"
        }`}
      >
        {post.imageLabel}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {post.styleTag}
        </span>
        <span className="text-xs text-slate-500">{post.createdAt}</span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-bold text-slate-900 sm:text-base">
        {post.title}
      </h3>
      <p className="mt-1 text-xs text-slate-500">@{post.author}</p>
      <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-600">
        <span>평점 {post.score}</span>
        <span>좋아요 {post.likes}</span>
        <span>댓글 {post.comments}</span>
      </div>
    </>
  );
}

/**
 * 피드/랜딩/상세 화면에서 공통으로 사용하는 게시글 카드 컴포넌트입니다.
 */
export function PostCard({ post, href, compact = false }: PostCardProps) {
  const card = (
    <article className="danga-panel h-full p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <PostCardContent post={post} compact={compact} />
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    );
  }

  return card;
}
