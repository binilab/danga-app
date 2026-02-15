"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPostDate } from "@/lib/posts";
import {
  getNotificationActorLabel,
  getNotificationMessage,
  getNotificationTargetHref,
  getNotificationTypeLabel,
  type NotificationItem,
} from "@/lib/notifications";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NotificationListProps = {
  viewerId: string;
  initialItems: NotificationItem[];
};

/**
 * 헤더 뱃지 동기화를 위해 알림 상태 변경 이벤트를 브라우저 전역으로 전파합니다.
 */
function dispatchNotificationsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("danga:notifications-updated"));
}

/**
 * 알림 목록에서 개별 읽음 처리/모두 읽음/상세 이동을 담당하는 클라이언트 컴포넌트입니다.
 */
export function NotificationList({ viewerId, initialItems }: NotificationListProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  /**
   * 알림 1건을 읽음 처리하고 post_id가 있으면 게시글 상세로 이동합니다.
   */
  async function handleOpenNotification(item: NotificationItem) {
    if (pendingId || isMarkingAll) {
      return;
    }

    setPendingId(item.id);
    setMessage(null);
    setIsErrorMessage(false);

    if (!item.isRead) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", item.id)
        .eq("user_id", viewerId);

      if (error) {
        setPendingId(null);
        setIsErrorMessage(true);
        setMessage("알림 읽음 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setItems((prev) =>
        prev.map((current) => {
          if (current.id !== item.id) {
            return current;
          }

          return {
            ...current,
            isRead: true,
          };
        }),
      );
      dispatchNotificationsUpdated();
    }

    const targetHref = getNotificationTargetHref(item);

    if (targetHref) {
      router.push(targetHref);
      router.refresh();
    }

    setPendingId(null);
  }

  /**
   * 현재 사용자의 미확인 알림을 한 번에 읽음 처리합니다.
   */
  async function handleMarkAllRead() {
    if (isMarkingAll || unreadCount === 0) {
      return;
    }

    setIsMarkingAll(true);
    setMessage(null);
    setIsErrorMessage(false);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", viewerId)
      .eq("is_read", false);

    if (error) {
      setIsMarkingAll(false);
      setIsErrorMessage(true);
      setMessage("모든 알림 읽음 처리에 실패했습니다.");
      return;
    }

    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setIsMarkingAll(false);
    setIsErrorMessage(false);
    setMessage("모든 알림을 읽음 처리했습니다.");
    dispatchNotificationsUpdated();
  }

  return (
    <section className="space-y-3">
      <div className="danga-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs text-slate-500">미확인 알림</p>
          <p className="text-lg font-bold text-slate-900">{unreadCount}개</p>
        </div>
        <button
          type="button"
          disabled={isMarkingAll || unreadCount === 0}
          onClick={() => {
            void handleMarkAllRead();
          }}
          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMarkingAll ? "처리 중..." : "모두 읽음"}
        </button>
      </div>

      {message ? (
        <p
          className={`danga-panel px-4 py-3 text-sm font-medium ${
            isErrorMessage ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="danga-panel p-5 text-sm text-slate-600">
          아직 도착한 알림이 없습니다.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const actorLabel = getNotificationActorLabel(item);
            const typeLabel = getNotificationTypeLabel(item.type);
            const targetHref = getNotificationTargetHref(item);
            const isPending = pendingId === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={Boolean(pendingId) || isMarkingAll}
                  onClick={() => {
                    void handleOpenNotification(item);
                  }}
                  className={`danga-panel flex w-full items-start gap-3 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    item.isRead ? "bg-white" : "bg-amber-50/60"
                  }`}
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-slate-100">
                    {item.actorAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.actorAvatarUrl}
                        alt={`${actorLabel} 아바타`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-600">
                        {actorLabel.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {typeLabel}
                      </span>
                      {!item.isRead ? (
                        <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[11px] font-semibold text-white">
                          NEW
                        </span>
                      ) : null}
                      <span className="text-xs text-slate-500">{formatPostDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">@{actorLabel}</p>
                    <p className="mt-1 text-sm text-slate-700">{getNotificationMessage(item)}</p>
                    {targetHref ? (
                      <p className="mt-2 text-xs font-semibold text-[var(--brand)]">
                        게시글로 이동하기
                      </p>
                    ) : null}
                    {isPending ? (
                      <p className="mt-2 text-xs text-slate-500">처리 중...</p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
