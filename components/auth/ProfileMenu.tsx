"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ProfileMenuProps = {
  nickname: string;
  avatarUrl: string | null;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
};

/**
 * 닉네임에서 프로필 아바타에 표시할 첫 글자를 계산합니다.
 */
function getAvatarInitial(nickname: string) {
  return nickname.trim().charAt(0).toUpperCase() || "D";
}

/**
 * 로그인된 사용자의 드롭다운 메뉴를 렌더링합니다.
 */
export function ProfileMenu({
  nickname,
  avatarUrl,
  isSigningOut,
  onSignOut,
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  /**
   * 메뉴 바깥을 클릭하면 드롭다운이 닫히도록 문서 이벤트를 등록합니다.
   */
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="order-2 relative sm:order-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="프로필 메뉴 열기"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${nickname} 프로필 이미지`}
            className="h-full w-full object-cover"
          />
        ) : (
          getAvatarInitial(nickname)
        )}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-lg">
          <p className="px-2 py-1 text-xs font-semibold text-slate-500">@{nickname}</p>
          <Link
            href="/me"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            내 피드
          </Link>
          <Link
            href="/post/new"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            업로드
          </Link>
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            알림
          </Link>
          <button
            type="button"
            onClick={() => {
              void onSignOut();
            }}
            disabled={isSigningOut}
            className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
          >
            {isSigningOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
