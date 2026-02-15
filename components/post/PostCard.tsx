import Image from "next/image";
import Link from "next/link";
import { VoteButton } from "@/components/post/VoteButton";
import { Badge } from "@/components/ui/Badge";
import { formatPostDate } from "@/lib/posts";
import { formatRankingBadgeLabel, getRankingBadgeClass } from "@/lib/rankings";

type PostCardProps = {
  id: string;
  imageUrl: string;
  caption: string;
  tags?: string[] | null;
  createdAt: string;
  authorLabel: string;
  voteCount: number;
  likedByMe: boolean;
  isLoggedIn: boolean;
  badge?: string | null;
  href?: string;
};

/**
 * 카드 상단 미디어 영역을 4:5 비율로 고정해 피드 레이아웃 흔들림을 줄입니다.
 */
function PostMedia({ href, imageUrl }: { href?: string; imageUrl: string }) {
  const image = (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-slate-100">
      <Image
        src={imageUrl}
        alt="코디 이미지"
        fill
        className="object-cover transition duration-300 hover:scale-[1.02]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );

  if (!href) {
    return image;
  }

  return <Link href={href}>{image}</Link>;
}

/**
 * 피드/상세에서 재사용하는 게시글 카드 본체입니다.
 */
export function PostCard({
  id,
  imageUrl,
  caption,
  tags = [],
  createdAt,
  authorLabel,
  voteCount,
  likedByMe,
  isLoggedIn,
  badge = null,
  href,
}: PostCardProps) {
  const badgeLabel = formatRankingBadgeLabel(badge);
  const normalizedTags = (tags ?? []).filter((tag) => tag.trim().length > 0).slice(0, 5);
  const captionContent = (
    <p className="line-clamp-3 text-sm font-medium leading-6 text-slate-800">{caption}</p>
  );

  return (
    <article className="danga-panel h-full p-4">
      <PostMedia href={href} imageUrl={imageUrl} />

      <div className="mt-4 space-y-3">
        {href ? <Link href={href}>{captionContent}</Link> : captionContent}

        {normalizedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {normalizedTags.map((tag) => (
              <Link
                key={`${id}-${tag}`}
                href={`/search?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-[var(--line)] bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
        <div className="min-w-0 text-xs text-slate-500">
          <p className="truncate font-semibold text-slate-700">@{authorLabel}</p>
          <p className="mt-1">{formatPostDate(createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          {badgeLabel ? (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${getRankingBadgeClass(badge)}`}
            >
              {badgeLabel}
            </span>
          ) : (
            <Badge tone="neutral" className="text-[11px]">
              일반
            </Badge>
          )}
          <VoteButton
            postId={id}
            initialCount={voteCount}
            initialLikedByMe={likedByMe}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </article>
  );
}
