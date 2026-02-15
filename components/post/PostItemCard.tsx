import Link from "next/link";
import { formatPostDate } from "@/lib/posts";
import {
  formatRankingBadgeLabel,
  getRankingBadgeClass,
} from "@/lib/rankings";
import { VoteButton } from "@/components/post/VoteButton";

type PostItemCardProps = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  authorLabel: string;
  voteCount: number;
  likedByMe: boolean;
  isLoggedIn: boolean;
  badge?: string | null;
  href?: string;
};

/**
 * 카드 상단 콘텐츠(이미지+캡션)를 링크 유무에 맞게 렌더링합니다.
 */
function PostMainContent({
  href,
  imageUrl,
  caption,
}: {
  href?: string;
  imageUrl: string;
  caption: string;
}) {
  const content = (
    <>
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
    </>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

/**
 * 피드/상세에서 공통으로 사용하는 게시글 카드 컴포넌트입니다.
 */
export function PostItemCard({
  id,
  imageUrl,
  caption,
  createdAt,
  authorLabel,
  voteCount,
  likedByMe,
  isLoggedIn,
  badge = null,
  href,
}: PostItemCardProps) {
  const badgeLabel = formatRankingBadgeLabel(badge);

  return (
    <article className="danga-panel h-full p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <PostMainContent href={href} imageUrl={imageUrl} caption={caption} />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="text-xs text-slate-500">
          <p>@{authorLabel}</p>
          <p className="mt-1">{formatPostDate(createdAt)}</p>
          {badgeLabel ? (
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${getRankingBadgeClass(badge)}`}
            >
              {badgeLabel}
            </span>
          ) : null}
        </div>
        <VoteButton
          postId={id}
          initialCount={voteCount}
          initialLikedByMe={likedByMe}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </article>
  );
}
