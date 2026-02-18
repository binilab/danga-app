"use client";

import { useMemo, useState } from "react";
import { ReportButton } from "@/components/report/ReportButton";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/State";
import { MAX_COMMENT_LENGTH, validateCommentBody } from "@/lib/comments";
import { formatPostDate } from "@/lib/posts";

type SortOrder = "oldest" | "latest";

type CommentItem = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  depth: number;
  reply_to_user_id: string | null;
  created_at: string;
  deleted_at: string | null;
  author_label?: string | null;
};

type CommentSectionProps = {
  postId: string;
  isLoggedIn: boolean;
  initialComments: CommentItem[];
  hasInitialLoadError?: boolean;
  currentUserId?: string | null;
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

type DeleteCommentResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

type ThreadItem = {
  parent: CommentItem;
  replies: CommentItem[];
};

/**
 * API 응답 본문을 JSON으로 읽고 실패 시 null을 반환합니다.
 */
async function readJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 비로그인 액션 시 헤더 로그인 모달을 열도록 이벤트를 보냅니다.
 */
function openLoginModal(message: string) {
  window.dispatchEvent(new CustomEvent("danga:open-login", { detail: { message } }));
}

function toReplyPrefill(authorLabel?: string | null) {
  const nickname = authorLabel?.trim() || "익명";
  return `@${nickname} `;
}

function toEpoch(value: string) {
  const epoch = new Date(value).getTime();
  return Number.isNaN(epoch) ? 0 : epoch;
}

/**
 * 게시글 상세에서 댓글/대댓글 작성 및 스레드 목록을 담당하는 클라이언트 컴포넌트입니다.
 */
export function CommentSection({
  postId,
  isLoggedIn,
  initialComments,
  hasInitialLoadError = false,
  currentUserId = null,
  currentUserLabel = null,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [body, setBody] = useState("");
  const [isSubmittingTopLevel, setIsSubmittingTopLevel] = useState(false);
  const [activeReplyParentId, setActiveReplyParentId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmittingParentId, setReplySubmittingParentId] = useState<string | null>(null);
  const [deletingCommentIds, setDeletingCommentIds] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const threads = useMemo(() => {
    const parentComments = comments.filter((comment) => comment.parent_id === null);
    const parentMap = new Map(parentComments.map((comment) => [comment.id, comment]));
    const replyMap = new Map<string, CommentItem[]>();

    for (const comment of comments) {
      if (!comment.parent_id || !parentMap.has(comment.parent_id)) {
        continue;
      }

      const list = replyMap.get(comment.parent_id) ?? [];
      list.push(comment);
      replyMap.set(comment.parent_id, list);
    }

    const sortedParents = [...parentComments].sort((a, b) => {
      const aEpoch = toEpoch(a.created_at);
      const bEpoch = toEpoch(b.created_at);
      return sortOrder === "oldest" ? aEpoch - bEpoch : bEpoch - aEpoch;
    });

    for (const replyList of replyMap.values()) {
      replyList.sort((a, b) => toEpoch(a.created_at) - toEpoch(b.created_at));
    }

    return sortedParents.map((parent) => {
      return {
        parent,
        replies: replyMap.get(parent.id) ?? [],
      } satisfies ThreadItem;
    });
  }, [comments, sortOrder]);

  const visibleCommentCount = useMemo(() => {
    return threads.reduce((sum, thread) => sum + 1 + thread.replies.length, 0);
  }, [threads]);

  const hasPendingAction = isSubmittingTopLevel || Boolean(replySubmittingParentId);

  async function createComment({
    rawBody,
    parentComment,
  }: {
    rawBody: string;
    parentComment: CommentItem | null;
  }) {
    if (hasPendingAction) {
      return;
    }

    if (!isLoggedIn) {
      const loginMessage = "댓글 작성은 로그인 후 사용할 수 있습니다.";
      setIsError(true);
      setMessage(loginMessage);
      openLoginModal(loginMessage);
      return;
    }

    const validation = validateCommentBody(rawBody);

    if (!validation.ok) {
      setIsError(true);
      setMessage(validation.message);
      return;
    }

    setMessage(null);
    setIsError(false);

    if (parentComment) {
      setReplySubmittingParentId(parentComment.id);
    } else {
      setIsSubmittingTopLevel(true);
    }

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          body: validation.value,
          parentId: parentComment?.id ?? null,
        }),
      });
      const result = await readJson<CreateCommentResponse>(response);

      if (!response.ok || !result || !result.ok) {
        const fallbackMessage =
          result && "message" in result
            ? result.message
            : "댓글 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";

        setIsError(true);
        setMessage(fallbackMessage);
        return;
      }

      setComments((prev) => [...prev, { ...result.comment, author_label: currentUserLabel }]);

      if (parentComment) {
        setReplyBody("");
        setActiveReplyParentId(null);
        setMessage("답글이 등록되었습니다.");
      } else {
        setBody("");
        setMessage("댓글이 등록되었습니다.");
      }

      setIsError(false);
    } catch {
      setIsError(true);
      setMessage("네트워크 오류로 댓글 저장에 실패했습니다.");
    } finally {
      if (parentComment) {
        setReplySubmittingParentId(null);
      } else {
        setIsSubmittingTopLevel(false);
      }
    }
  }

  async function handleDelete(commentId: string) {
    if (deletingCommentIds[commentId] || hasPendingAction) {
      return;
    }

    if (!isLoggedIn) {
      const loginMessage = "댓글 삭제는 로그인 후 사용할 수 있습니다.";
      setIsError(true);
      setMessage(loginMessage);
      openLoginModal(loginMessage);
      return;
    }

    setDeletingCommentIds((prev) => ({ ...prev, [commentId]: true }));
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      const result = await readJson<DeleteCommentResponse>(response);

      if (!response.ok || !result || !result.ok) {
        const fallbackMessage =
          result && "message" in result
            ? result.message
            : "댓글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.";

        setIsError(true);
        setMessage(fallbackMessage);
        return;
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setIsError(false);
      setMessage("댓글이 삭제되었습니다.");
    } catch {
      setIsError(true);
      setMessage("네트워크 오류로 댓글 삭제에 실패했습니다.");
    } finally {
      setDeletingCommentIds((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    }
  }

  return (
    <section className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">댓글 {visibleCommentCount}</h2>
        <div className="inline-flex rounded-full border border-[var(--line)] bg-white p-1">
          <Button
            type="button"
            size="sm"
            variant={sortOrder === "oldest" ? "secondary" : "ghost"}
            disabled={hasPendingAction}
            onClick={() => setSortOrder("oldest")}
          >
            오래된순
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sortOrder === "latest" ? "secondary" : "ghost"}
            disabled={hasPendingAction}
            onClick={() => setSortOrder("latest")}
          >
            최신순
          </Button>
        </div>
      </div>

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
            disabled={hasPendingAction}
            className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] disabled:bg-slate-100"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {body.trim().length}/{MAX_COMMENT_LENGTH}
            </p>
            <Button
              type="button"
              disabled={hasPendingAction}
              onClick={() => {
                void createComment({
                  rawBody: body,
                  parentComment: null,
                });
              }}
              variant="primary"
            >
              {isSubmittingTopLevel ? "등록 중..." : "댓글 남기기"}
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

      {hasInitialLoadError ? (
        <ErrorState
          title="댓글을 불러오지 못했어요."
          description="잠시 후 새로고침해서 다시 시도해주세요."
        />
      ) : visibleCommentCount === 0 ? (
        <EmptyState
          title="아직 댓글이 없어요."
          description="첫 반응을 남기고 분위기를 열어줘."
        />
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => {
            const { parent, replies } = thread;
            const isReplyFormOpen = activeReplyParentId === parent.id;
            const isReplySubmitting = replySubmittingParentId === parent.id;

            return (
              <li key={parent.id} className="space-y-2">
                <div className="danga-panel p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        @{parent.author_label ?? "익명"} · {formatPostDate(parent.created_at)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                        {parent.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {currentUserId && currentUserId === parent.user_id ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={Boolean(deletingCommentIds[parent.id]) || hasPendingAction}
                          onClick={() => {
                            void handleDelete(parent.id);
                          }}
                        >
                          {deletingCommentIds[parent.id] ? "삭제 중..." : "삭제"}
                        </Button>
                      ) : null}
                      <ReportButton
                        targetType="comment"
                        targetId={parent.id}
                        isLoggedIn={isLoggedIn}
                        className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={hasPendingAction}
                      onClick={() => {
                        if (isReplyFormOpen) {
                          setActiveReplyParentId(null);
                          setReplyBody("");
                          return;
                        }

                        setActiveReplyParentId(parent.id);
                        setReplyBody(toReplyPrefill(parent.author_label));
                      }}
                    >
                      {isReplyFormOpen ? "답글 닫기" : "답글 달기"}
                    </Button>
                  </div>
                  {isReplyFormOpen ? (
                    <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-[var(--line)] bg-slate-50 p-3">
                      <textarea
                        rows={2}
                        value={replyBody}
                        onChange={(event) => setReplyBody(event.target.value)}
                        placeholder="답글을 입력해줘"
                        maxLength={MAX_COMMENT_LENGTH}
                        disabled={isReplySubmitting}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)] disabled:bg-slate-100"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          {replyBody.trim().length}/{MAX_COMMENT_LENGTH}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isReplySubmitting}
                          onClick={() => {
                            void createComment({
                              rawBody: replyBody,
                              parentComment: parent,
                            });
                          }}
                        >
                          {isReplySubmitting ? "등록 중..." : "답글 등록"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {replies.length > 0 ? (
                  <ul className="ml-5 space-y-2 border-l border-slate-200 pl-4">
                    {replies.map((reply) => (
                      <li key={reply.id} className="danga-panel p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">
                              @{reply.author_label ?? "익명"} · {formatPostDate(reply.created_at)}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                              {reply.body}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {currentUserId && currentUserId === reply.user_id ? (
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={Boolean(deletingCommentIds[reply.id]) || hasPendingAction}
                                onClick={() => {
                                  void handleDelete(reply.id);
                                }}
                              >
                                {deletingCommentIds[reply.id] ? "삭제 중..." : "삭제"}
                              </Button>
                            ) : null}
                            <ReportButton
                              targetType="comment"
                              targetId={reply.id}
                              isLoggedIn={isLoggedIn}
                              className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
