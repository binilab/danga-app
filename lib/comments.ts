export const MAX_COMMENT_LENGTH = 500;

/**
 * 댓글 본문을 정규화하고 길이 제약(1~500자)을 검사합니다.
 */
export function validateCommentBody(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      ok: false,
      message: "댓글 내용을 입력해주세요.",
      value: trimmed,
    } as const;
  }

  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return {
      ok: false,
      message: `댓글은 최대 ${MAX_COMMENT_LENGTH}자까지 입력할 수 있습니다.`,
      value: trimmed,
    } as const;
  }

  return {
    ok: true,
    value: trimmed,
  } as const;
}
