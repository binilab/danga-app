import type { SupabaseClient } from "@supabase/supabase-js";
import { toAuthorLabel } from "@/lib/posts";

export const NOTIFICATION_PAGE_SIZE = 50;

export type NotificationType = "vote" | "comment" | "report_update";

type NotificationRow = {
  id: string;
  type: string;
  actor_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  report_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

type NotificationActorProfileRow = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actorId: string | null;
  actorNickname: string | null;
  actorAvatarUrl: string | null;
  postId: string | null;
  commentId: string | null;
  reportId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

/**
 * DB 문자열 타입을 앱에서 사용하는 NotificationType 유니온으로 안전하게 변환합니다.
 */
function toNotificationType(value: string): NotificationType {
  if (value === "vote") {
    return "vote";
  }

  if (value === "comment") {
    return "comment";
  }

  return "report_update";
}

/**
 * 알림 타입을 화면용 한글 라벨로 변환합니다.
 */
export function getNotificationTypeLabel(type: NotificationType) {
  if (type === "vote") {
    return "좋아요";
  }

  if (type === "comment") {
    return "댓글";
  }

  return "신고";
}

/**
 * 알림 클릭 시 이동할 경로를 계산합니다. MVP에서는 post_id가 있으면 상세 페이지로 이동합니다.
 */
export function getNotificationTargetHref(notification: Pick<NotificationItem, "postId">) {
  if (!notification.postId) {
    return null;
  }

  return `/p/${notification.postId}`;
}

/**
 * 알림 발신자 표시 이름을 nickname 우선으로 만들고 없으면 user_id 일부를 사용합니다.
 */
export function getNotificationActorLabel(
  notification: Pick<NotificationItem, "actorId" | "actorNickname">,
) {
  if (notification.actorNickname?.trim()) {
    return notification.actorNickname.trim();
  }

  if (notification.actorId) {
    return toAuthorLabel(notification.actorId);
  }

  return "system";
}

/**
 * DB 메시지가 비어 있는 예외 상황에서도 기본 메시지를 반환해 UI가 깨지지 않도록 보장합니다.
 */
export function getNotificationMessage(notification: Pick<NotificationItem, "message" | "type">) {
  if (notification.message?.trim()) {
    return notification.message.trim();
  }

  if (notification.type === "vote") {
    return "내 게시글에 좋아요가 도착했습니다.";
  }

  if (notification.type === "comment") {
    return "내 게시글에 댓글이 도착했습니다.";
  }

  return "신고 처리 상태가 변경되었습니다.";
}

/**
 * 헤더 뱃지 표시를 위해 사용자 미확인 알림 수를 조회합니다.
 */
export async function fetchUnreadNotificationCount({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    return null;
  }

  return count ?? 0;
}

/**
 * 알림 목록과 발신자 프로필을 in() 일괄 조회로 결합해 UI 렌더링용 배열로 반환합니다.
 */
export async function fetchNotificationItemsForUser({
  supabase,
  userId,
  limit = NOTIFICATION_PAGE_SIZE,
}: {
  supabase: SupabaseClient;
  userId: string;
  limit?: number;
}) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, actor_id, post_id, comment_id, report_id, message, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      items: [] as NotificationItem[],
      hasError: true,
    };
  }

  const rows = (data ?? []) as NotificationRow[];
  const actorIds = [
    ...new Set(rows.map((row) => row.actor_id).filter((value): value is string => Boolean(value))),
  ];
  const profileMap = new Map<string, NotificationActorProfileRow>();

  if (actorIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, nickname, avatar_url")
      .in("id", actorIds);

    const profiles = (profileData ?? []) as NotificationActorProfileRow[];

    for (const profile of profiles) {
      profileMap.set(profile.id, profile);
    }
  }

  return {
    items: rows.map((row) => {
      const actorProfile = row.actor_id ? profileMap.get(row.actor_id) : undefined;

      return {
        id: row.id,
        type: toNotificationType(row.type),
        actorId: row.actor_id,
        actorNickname: actorProfile?.nickname ?? null,
        actorAvatarUrl: actorProfile?.avatar_url ?? null,
        postId: row.post_id,
        commentId: row.comment_id,
        reportId: row.report_id,
        message: row.message,
        isRead: row.is_read,
        createdAt: row.created_at,
      } satisfies NotificationItem;
    }),
    hasError: false,
  };
}
