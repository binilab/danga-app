import type { SupabaseClient } from "@supabase/supabase-js";

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
 * 프로필 닉네임을 찾지 못했을 때 사용할 기본 작성자 라벨을 반환합니다.
 */
export function toAuthorLabel(userId: string) {
  return userId.trim().length > 0 ? "익명" : "익명";
}

/**
 * user_id 배열 기준으로 profiles.nickname을 한 번에 조회해 작성자 라벨 맵으로 변환합니다.
 */
export async function fetchAuthorLabelMapForUserIds({
  supabase,
  userIds,
}: {
  supabase: SupabaseClient;
  userIds: string[];
}) {
  const uniqueUserIds = [...new Set(userIds.filter((userId) => userId.trim().length > 0))];

  if (uniqueUserIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname")
    .in("id", uniqueUserIds);
  const labelMap = new Map<string, string>();

  if (!error && data) {
    for (const row of data as { id: string; nickname: string | null }[]) {
      const nickname = row.nickname?.trim();

      if (nickname) {
        labelMap.set(row.id, nickname);
      }
    }
  }

  for (const userId of uniqueUserIds) {
    if (!labelMap.has(userId)) {
      labelMap.set(userId, toAuthorLabel(userId));
    }
  }

  return labelMap;
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
