"use client";

import { useVote } from "@/hooks/useVote";

type VoteButtonProps = {
  postId: string;
  initialCount: number;
  initialLikedByMe: boolean;
  isLoggedIn: boolean;
};

/**
 * 게시글의 좋아요 버튼 UI와 optimistic 토글 동작을 담당합니다.
 */
export function VoteButton({
  postId,
  initialCount,
  initialLikedByMe,
  isLoggedIn,
}: VoteButtonProps) {
  const { count, likedByMe, isPending, message, toggleVote } = useVote({
    postId,
    initialCount,
    initialLikedByMe,
    isLoggedIn,
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          void toggleVote();
        }}
        className={`danga-touch rounded-full border px-3.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          likedByMe
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-[var(--line)] bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {likedByMe ? "♥ 좋아요" : "♡ 좋아요"} {count}
      </button>
      {message ? <p className="text-[11px] text-rose-600">{message}</p> : null}
    </div>
  );
}
