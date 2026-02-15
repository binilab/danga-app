"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoginModal } from "@/components/auth/LoginModal";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { Badge } from "@/components/ui/Badge";
import { fetchUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const menuItems = [
  { href: "/feed", label: "피드" },
  { href: "/rank", label: "랭킹" },
];

type HeaderUser = {
  id: string;
  nickname: string;
  avatarUrl: string | null;
};

type ProfileRow = {
  nickname: string | null;
  avatar_url: string | null;
};

/**
 * 현재 페이지 경로와 메뉴 링크를 비교해서 활성화 스타일 적용 여부를 계산합니다.
 */
function isMenuActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * user_metadata에서 문자열 값을 안전하게 추출합니다.
 */
function getMetadataString(user: User, keys: string[]): string | null {
  const metadata = user.user_metadata as Record<string, unknown> | null;

  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

/**
 * DB 프로필이 없을 때 표시할 닉네임 기본값을 계산합니다.
 */
function getFallbackNickname(user: User): string {
  const metadataName = getMetadataString(user, ["nickname", "user_name", "full_name", "name"]);

  if (metadataName) {
    return metadataName;
  }

  if (user.email) {
    return user.email.split("@")[0] ?? "danga_user";
  }

  return "danga_user";
}

/**
 * DB 프로필이 없을 때 표시할 아바타 URL 기본값을 계산합니다.
 */
function getFallbackAvatarUrl(user: User): string | null {
  return getMetadataString(user, ["avatar_url", "picture"]);
}

/**
 * profiles 테이블이 아직 없을 때의 오류를 감지합니다.
 */
function isMissingProfilesTableError(error: { code?: string } | null) {
  return error?.code === "42P01";
}

/**
 * 헤더 우상단의 사용자 상태를 만들기 위해 profiles 데이터를 읽어옵니다.
 */
async function resolveHeaderUser(
  session: Session,
  syncProfile: boolean,
  setNotice: (message: string) => void,
) {
  const supabase = createSupabaseBrowserClient();
  const fallbackNickname = getFallbackNickname(session.user);
  const fallbackAvatarUrl = getFallbackAvatarUrl(session.user);
  let nickname = fallbackNickname;
  let avatarUrl = fallbackAvatarUrl;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError && !isMissingProfilesTableError(profileError)) {
    setNotice("프로필 정보를 읽지 못했습니다. 잠시 후 다시 확인해주세요.");
  }

  const typedProfile = profile as ProfileRow | null;

  if (typedProfile) {
    nickname = typedProfile.nickname ?? fallbackNickname;
    avatarUrl = typedProfile.avatar_url ?? fallbackAvatarUrl;
  }

  if (syncProfile) {
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: session.user.id,
        nickname,
        avatar_url: avatarUrl,
      },
      { onConflict: "id" },
    );

    if (upsertError && !isMissingProfilesTableError(upsertError)) {
      setNotice("프로필 저장에 실패했습니다. 권한 설정을 확인해주세요.");
    }
  }

  return {
    id: session.user.id,
    nickname,
    avatarUrl,
  } satisfies HeaderUser;
}

/**
 * 모든 페이지에서 공통으로 보여줄 상단 헤더입니다.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<HeaderUser | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const authMessageFromUrl = searchParams.get("authMessage");
  const activeNoticeMessage = noticeMessage ?? authMessageFromUrl;

  /**
   * 로그인 사용자 민감 정보(email/name)를 서버에서 암호화 컬럼으로 동기화합니다.
   */
  const syncEncryptedProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profiles/encrypted", {
        method: "POST",
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        if (result.message) {
          setNoticeMessage(result.message);
        }
      }
    } catch {
      setNoticeMessage("암호화 프로필 동기화 중 네트워크 오류가 발생했습니다.");
    }
  }, []);

  /**
   * 세션 정보에서 현재 헤더 사용자 상태와 알림 카운트를 계산하고 반영합니다.
   */
  const syncAuthUser = useCallback(
    async (session: Session | null, syncProfile: boolean) => {
      if (!session) {
        setCurrentUser(null);
        setUnreadNotificationCount(0);
        return;
      }

      const resolved = await resolveHeaderUser(session, syncProfile, setNoticeMessage);
      setCurrentUser(resolved);

      const count = await fetchUnreadNotificationCount({
        supabase,
        userId: resolved.id,
      });

      if (count !== null) {
        setUnreadNotificationCount(count);
      }
    },
    [supabase],
  );

  /**
   * 현재 로그인 사용자의 미확인 알림 수를 다시 계산합니다.
   */
  const refreshUnreadNotificationCount = useCallback(async () => {
    const userId = currentUser?.id ?? null;

    if (!userId) {
      setUnreadNotificationCount(0);
      return;
    }

    const count = await fetchUnreadNotificationCount({
      supabase,
      userId,
    });

    if (count !== null) {
      setUnreadNotificationCount(count);
    }
  }, [currentUser?.id, supabase]);

  /**
   * 페이지 URL에 인증 에러 메시지가 있으면 토스트로 보여준 뒤 URL에서 제거합니다.
   */
  useEffect(() => {
    const authMessage = searchParams.get("authMessage");

    if (!authMessage) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("authMessage");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  /**
   * 최초 렌더링 시 현재 세션을 읽고 인증 상태 변경 이벤트를 구독합니다.
   */
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      await syncAuthUser(session, false);
      if (session) {
        void syncEncryptedProfile();
      }

      if (isMounted) {
        setIsCheckingSession(false);
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const shouldSyncProfile = event === "SIGNED_IN" || event === "USER_UPDATED";
      void syncAuthUser(session, shouldSyncProfile);

      if (event === "SIGNED_IN") {
        setIsAuthModalOpen(false);
        setNoticeMessage(null);
        void syncEncryptedProfile();
        router.refresh();
      }

      if (event === "USER_UPDATED") {
        void syncEncryptedProfile();
      }

      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setUnreadNotificationCount(0);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase, syncAuthUser, syncEncryptedProfile]);

  /**
   * 안내 토스트를 일정 시간 뒤 자동으로 사라지게 처리합니다.
   */
  useEffect(() => {
    if (!noticeMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNoticeMessage(null);
    }, 4500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [noticeMessage]);

  /**
   * 다른 컴포넌트에서 로그인 모달 오픈 이벤트를 보내면 헤더에서 모달을 엽니다.
   */
  useEffect(() => {
    const handleOpenLogin = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      const incomingMessage = custom.detail?.message;

      if (incomingMessage) {
        setNoticeMessage(incomingMessage);
      }

      setIsAuthModalOpen(true);
    };

    window.addEventListener("danga:open-login", handleOpenLogin);

    return () => {
      window.removeEventListener("danga:open-login", handleOpenLogin);
    };
  }, []);

  /**
   * 프로필 편집 이후 헤더 닉네임/아바타를 즉시 갱신할 수 있도록 사용자 상태를 재동기화합니다.
   */
  useEffect(() => {
    const handleRefreshHeaderUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await syncAuthUser(session, false);
    };

    window.addEventListener("danga:refresh-header-user", handleRefreshHeaderUser);

    return () => {
      window.removeEventListener("danga:refresh-header-user", handleRefreshHeaderUser);
    };
  }, [supabase, syncAuthUser]);

  /**
   * 알림 페이지 읽음 처리 후 전송되는 이벤트를 받아 헤더 카운트를 즉시 갱신합니다.
   */
  useEffect(() => {
    const handleRefreshNotifications = () => {
      void refreshUnreadNotificationCount();
    };

    window.addEventListener("danga:notifications-updated", handleRefreshNotifications);

    return () => {
      window.removeEventListener("danga:notifications-updated", handleRefreshNotifications);
    };
  }, [refreshUnreadNotificationCount]);

  /**
   * 로그아웃 요청을 보내고 세션 종료 후 랜딩 페이지로 이동합니다.
   */
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setNoticeMessage("로그아웃에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setIsSigningOut(false);
      return;
    }

    setCurrentUser(null);
    setIsSigningOut(false);
    router.push("/");
    router.refresh();
  }, [router, supabase]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/92 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--foreground)] text-xs font-black text-white transition group-hover:scale-105">
              D
            </span>
            <div>
              <p className="text-lg font-black tracking-tight text-[var(--foreground)]">DANGA</p>
              <p className="text-[11px] font-medium leading-none text-slate-500">단번에 가자</p>
            </div>
          </Link>

          <nav className="order-3 flex w-full items-center justify-center gap-2 sm:order-2 sm:w-auto">
            {menuItems.map((item) => {
              const active = isMenuActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`danga-touch rounded-full border px-4 text-sm font-semibold transition ${
                    active
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                      : "border-transparent text-slate-700 hover:border-[var(--line)] hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isCheckingSession ? (
            <div className="order-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-500 sm:order-3">
              세션 확인중
            </div>
          ) : currentUser ? (
            <div className="order-2 flex items-center gap-2 sm:order-3">
              <Link
                href="/notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white text-slate-700 transition hover:bg-slate-50"
                aria-label="알림 페이지로 이동"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0v5.1l1.6 2.4H4.9l1.6-2.4Z" />
                  <path d="M10 18.2a2 2 0 0 0 4 0" />
                </svg>
                {unreadNotificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                ) : null}
              </Link>
              <ProfileMenu
                nickname={currentUser.nickname}
                avatarUrl={currentUser.avatarUrl}
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="danga-touch order-2 rounded-full bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 sm:order-3"
            >
              로그인하고 시작
            </button>
          )}
        </div>
      </header>

      {activeNoticeMessage ? (
        <div className="fixed left-1/2 top-20 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-[var(--shadow-md)]">
          <div className="mb-1">
            <Badge tone="brand">안내</Badge>
          </div>
          {activeNoticeMessage.slice(0, 160)}
        </div>
      ) : null}

      <LoginModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
