"use client";

import { useState } from "react";

type VoteActionResponse =
  | {
      ok: true;
      count: number;
      likedByMe: boolean;
    }
  | {
      ok: false;
      message: string;
    };

/**
 * 응답 본문을 JSON으로 읽고 실패하면 null을 반환합니다.
 */
async function readVoteResponse(response: Response) {
  try {
    return (await response.json()) as VoteActionResponse;
  } catch {
    return null;
  }
}

/**
 * 비로그인 사용자가 액션을 눌렀을 때 헤더 로그인 모달을 열도록 이벤트를 전송합니다.
 */
function openLoginModal(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("danga:open-login", {
      detail: { message },
    }),
  );
}

/**
 * 좋아요 상태를 optimistic UI로 토글하고 서버 결과와 동기화하는 재사용 훅입니다.
 */
export function useVote({
  postId,
  initialCount,
  initialLikedByMe,
  isLoggedIn,
}: {
  postId: string;
  initialCount: number;
  initialLikedByMe: boolean;
  isLoggedIn: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * 좋아요/취소를 토글하고 실패 시 optimistic 상태를 원복합니다.
   */
  async function toggleVote() {
    if (isPending) {
      return;
    }

    if (!isLoggedIn) {
      const loginMessage = "좋아요는 로그인 후 사용할 수 있습니다.";
      setMessage(loginMessage);
      openLoginModal(loginMessage);
      return;
    }

    setMessage(null);

    const previousLiked = likedByMe;
    const previousCount = count;
    const nextLiked = !previousLiked;
    const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

    setLikedByMe(nextLiked);
    setCount(nextCount);
    setIsPending(true);

    try {
      const response = await fetch("/api/votes", {
        method: nextLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });
      const result = await readVoteResponse(response);

      if (!response.ok || !result || !result.ok) {
        const fallbackMessage =
          result && "message" in result
            ? result.message
            : "좋아요 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";

        setLikedByMe(previousLiked);
        setCount(previousCount);
        setMessage(fallbackMessage);

        if (response.status === 401) {
          openLoginModal(fallbackMessage);
        }

        return;
      }

      setLikedByMe(result.likedByMe);
      setCount(result.count);
    } catch {
      setLikedByMe(previousLiked);
      setCount(previousCount);
      setMessage("네트워크 문제로 좋아요 처리에 실패했습니다.");
    } finally {
      setIsPending(false);
    }
  }

  return {
    count,
    likedByMe,
    isPending,
    message,
    toggleVote,
  };
}
