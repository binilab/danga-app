"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type OAuthProvider = "google" | "kakao";

/**
 * Supabase/Auth 에러 메시지를 사용자가 이해하기 쉬운 문장으로 바꿉니다.
 */
function toFriendlyAuthError(provider: OAuthProvider, message: string) {
  if (provider === "kakao") {
    return "카카오 로그인을 사용할 수 없습니다. Supabase Auth > Providers에서 Kakao 설정 상태를 확인해주세요.";
  }

  if (message.toLowerCase().includes("cancel")) {
    return "로그인이 취소되었습니다. 다시 시도해주세요.";
  }

  return "로그인 요청에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

/**
 * OAuth 로그인 모달에서 provider 버튼을 렌더링합니다.
 */
function ProviderButton({
  provider,
  disabled,
  pending,
  onClick,
}: {
  provider: OAuthProvider;
  disabled: boolean;
  pending: boolean;
  onClick: (provider: OAuthProvider) => void;
}) {
  const label = provider === "google" ? "Google로 로그인" : "Kakao로 로그인";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(provider)}
      className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "이동 중..." : label}
    </button>
  );
}

/**
 * 헤더의 로그인 버튼으로 여는 로그인 모달입니다.
 */
export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();
  const [isPendingProvider, setIsPendingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 선택한 OAuth 제공자로 로그인 리다이렉트를 시작합니다.
   */
  async function handleOAuthLogin(provider: OAuthProvider) {
    setErrorMessage(null);
    setIsPendingProvider(provider);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", pathname || "/");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setErrorMessage(toFriendlyAuthError(provider, error.message));
        return;
      }

      if (!data.url) {
        setErrorMessage("로그인 페이지로 이동할 수 없습니다. 다시 시도해주세요.");
        return;
      }

      window.location.assign(data.url);
    } catch {
      setErrorMessage(toFriendlyAuthError(provider, "unknown"));
    } finally {
      setIsPendingProvider(null);
    }
  }

  /**
   * 모달이 열려 있을 때 ESC 키로 닫을 수 있도록 키보드 이벤트를 등록합니다.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="로그인 모달 닫기"
        className="absolute inset-0 bg-slate-900/45"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xl"
      >
        <h2 id="auth-modal-title" className="text-lg font-black text-slate-900">
          로그인하고 시작
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Google 또는 Kakao 계정으로 로그인해 바로 시작해봐.
        </p>

        <div className="mt-5 space-y-2">
          <ProviderButton
            provider="google"
            disabled={Boolean(isPendingProvider)}
            pending={isPendingProvider === "google"}
            onClick={handleOAuthLogin}
          />
          <ProviderButton
            provider="kakao"
            disabled={Boolean(isPendingProvider)}
            pending={isPendingProvider === "kakao"}
            onClick={handleOAuthLogin}
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          카카오가 동작하지 않으면 Supabase Auth 설정에서 Kakao Provider를 먼저
          활성화해야 합니다.
        </p>

        {errorMessage ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          닫기
        </button>
      </section>
    </div>
  );
}
