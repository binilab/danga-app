import Link from "next/link";
import { formatPostDate } from "@/lib/posts";

type PostItemCardProps = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  authorLabel: string;
  href?: string;
};

/**
 * 피드/상세에서 공통으로 사용하는 게시글 카드 본문을 렌더링합니다.
 */
function PostItemCardBody({
  imageUrl,
  caption,
  createdAt,
  authorLabel,
}: Omit<PostItemCardProps, "id" | "href">) {
  return (
    <article className="danga-panel h-full p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="업로드된 코디 이미지"
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      </div>
      <p className="mt-3 line-clamp-3 text-sm font-medium text-slate-800">{caption}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>@{authorLabel}</span>
        <span>{formatPostDate(createdAt)}</span>
      </div>
    </article>
  );
}

/**
 * 게시글 링크가 있을 때는 클릭 가능한 카드로, 없으면 일반 카드로 렌더링합니다.
 */
export function PostItemCard({ href, ...props }: PostItemCardProps) {
  if (!href) {
    return <PostItemCardBody {...props} />;
  }

  return (
    <Link href={href} className="block h-full">
      <PostItemCardBody {...props} />
    </Link>
  );
}
