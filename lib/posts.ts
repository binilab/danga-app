export type PostRow = {
  id: string;
  user_id: string;
  image_url: string;
  image_key: string | null;
  caption: string;
  tags: string[] | null;
  created_at: string;
  deleted_at: string | null;
};

/**
 * 사용자 식별 문자열(user_id)을 피드에 표시할 간단한 닉네임 형태로 변환합니다.
 */
export function toAuthorLabel(userId: string) {
  return `user_${userId.slice(0, 8)}`;
}

/**
 * 날짜 문자열을 사용자 친화적인 YYYY-MM-DD HH:mm 형태로 변환합니다.
 */
export function formatPostDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
