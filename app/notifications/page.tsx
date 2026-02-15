import { PageTitle } from "@/components/PageTitle";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/State";
import { fetchNotificationItemsForUser } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 로그인 사용자의 인앱 알림 목록을 보여주고 읽음 처리를 제공하는 페이지입니다.
 */
export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="알림"
          description="좋아요, 댓글, 운영 상태를 한 번에 확인해."
        />
        <EmptyState
          title="로그인이 필요해요."
          description='헤더의 "로그인하고 시작" 버튼으로 접속해줘.'
          action={<Button type="button" variant="secondary" disabled>로그인하고 시작</Button>}
        />
      </div>
    );
  }

  const { items, hasError } = await fetchNotificationItemsForUser({
    supabase,
    userId: user.id,
  });

  return (
    <div className="space-y-6">
      <PageTitle
        title="알림"
        description="좋아요, 댓글, 운영 상태 변경 알림을 최신순으로 보여줘."
      />
      {hasError ? (
        <ErrorState
          title="알림을 불러오지 못했어요."
          description="잠시 후 다시 시도해줘."
        />
      ) : (
        <NotificationList viewerId={user.id} initialItems={items} />
      )}
    </div>
  );
}
