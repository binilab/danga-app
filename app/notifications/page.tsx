import { PageTitle } from "@/components/PageTitle";
import { NotificationList } from "@/components/notifications/NotificationList";
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
          title="Notifications"
          description="좋아요/댓글/운영 처리 결과를 알림으로 확인합니다."
        />
        <section className="danga-panel p-5 text-sm text-slate-600">
          로그인 후 알림을 확인할 수 있습니다. 헤더의{" "}
          <span className="font-semibold">시작하기</span> 버튼으로 로그인해주세요.
        </section>
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
        title="Notifications"
        description="좋아요, 댓글, 운영 상태 변경 알림을 최신순으로 확인하세요."
      />
      {hasError ? (
        <section className="danga-panel p-5 text-sm text-rose-700">
          알림 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </section>
      ) : (
        <NotificationList viewerId={user.id} initialItems={items} />
      )}
    </div>
  );
}
