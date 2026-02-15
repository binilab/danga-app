"use client";

import { useState } from "react";
import { ReportButton } from "@/components/report/ReportButton";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/State";
import { MAX_COMMENT_LENGTH, validateCommentBody } from "@/lib/comments";
import { formatPostDate } from "@/lib/posts";

type CommentItem = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  author_label?: string | null;
};

type CommentSectionProps = {
  postId: string;
  isLoggedIn: boolean;
  initialComments: CommentItem[];
  currentUserLabel?: string | null;
};

type CreateCommentResponse =
  | {
      ok: true;
      comment: CommentItem;
    }
  | {
      ok: false;
      message: string;
    };

/**
 * 댓글 API 응답 본문을 JSON으로 읽고 실패 시 null을 반환합니다.
 */
async function readCommentResponse(response: Response) {
  try {
    return (await response.json()) as CreateCommentResponse;
  } catch {
    return null;
  }
}

/**
 * 비로그인 댓글 작성 시 헤더 로그인 모달을 열도록 이벤트를 보냅니다.
 */
function openLoginModal(message: string) {
  window.dispatchEvent(new CustomEvent("danga:open-login", { detail: { message } }));
}

/**
 * 게시글 상세에서 댓글 작성/목록 표시를 담당하는 클라이언트 컴포넌트입니다.
 */
export function CommentSection({
  postId,
  isLoggedIn,
  initialComments,
  currentUserLabel = null,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  /**
   * 댓글 내용을 서버에 저장하고 성공하면 목록 최상단에 즉시 추가합니다.
   */
  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    if (!isLoggedIn) {
      const loginMessage = "댓글 작성은 로그인 후 사용할 수 있습니다.";
      setIsError(true);
      setMessage(loginMessage);
      openLoginModal(loginMessage);
      return;
    }

    const validation = validateCommentBody(body);

    if (!validation.ok) {
      setIsError(true);
      setMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          body: validation.value,
        }),
      });
      const result = await readCommentResponse(response);

      if (!response.ok || !result || !result.ok) {
        const fallbackMessage =
          result && "message" in result
            ? result.message
            : "댓글 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";

        setIsError(true);
        setMessage(fallbackMessage);
        return;
      }

      setComments((prev) => [{ ...result.comment, author_label: currentUserLabel }, ...prev]);
      setBody("");
      setIsError(false);
      setMessage("댓글이 등록되었습니다.");
    } catch {
      setIsError(true);
      setMessage("네트워크 오류로 댓글 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-3">
      <h2 className="text-base font-bold text-slate-900">댓글 {comments.length}</h2>

      <Card>
        <CardHeader>
          <label htmlFor="comment-body" className="text-sm font-semibold text-slate-700">
            한 줄 코멘트
          </label>
        </CardHeader>
        <CardBody className="space-y-2">
          <textarea
            id="comment-body"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="한 줄 피드백 남겨줘"
            maxLength={MAX_COMMENT_LENGTH}
            className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {body.trim().length}/{MAX_COMMENT_LENGTH}
            </p>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                void handleSubmit();
              }}
              variant="primary"
            >
              {isSubmitting ? "등록 중..." : "댓글 남기기"}
            </Button>
          </div>
          {message ? (
            <p
              className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium ${
                isError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </p>
          ) : null}
        </CardBody>
      </Card>

      {comments.length === 0 ? (
        <EmptyState
          title="아직 댓글이 없어요."
          description="첫 반응을 남기고 분위기를 열어줘."
        />
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="danga-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    @{comment.author_label ?? "익명"} · {formatPostDate(comment.created_at)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                    {comment.body}
                  </p>
                </div>
                <ReportButton
                  targetType="comment"
                  targetId={comment.id}
                  isLoggedIn={isLoggedIn}
                  className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
