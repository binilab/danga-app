"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountDangerZoneProps = {
  userId: string;
};

/**
 * 탈퇴 확인 문구를 띄워 사용자가 의도한 요청인지 한 번 더 확인합니다.
 */
function confirmWithdrawal() {
  return window.confirm(
    "정말 계정을 탈퇴하시겠어요?\n프로필은 soft delete 처리되고 현재 세션은 로그아웃됩니다.",
  );
}

/**
 * /me 페이지 하단의 계정 탈퇴(soft delete + 로그아웃) 기능을 제공합니다.
 */
export function AccountDangerZone({ userId }: AccountDangerZoneProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * profiles.deleted_at에 현재 시각을 기록한 뒤 세션을 종료하고 랜딩으로 이동합니다.
   */
  async function handleWithdrawal() {
    if (isProcessing) {
      return;
    }

    if (!confirmWithdrawal()) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfileError) {
      setIsProcessing(false);
      setMessage("프로필 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const normalizedNickname = existingProfile?.nickname?.trim() || "deleted_user";
    const normalizedAvatarUrl = existingProfile?.avatar_url ?? null;
    const { error: updateError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        nickname: normalizedNickname,
        avatar_url: normalizedAvatarUrl,
        deleted_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (updateError) {
      setIsProcessing(false);
      setMessage("탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setIsProcessing(false);
      setMessage("탈퇴는 처리됐지만 로그아웃에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    setIsProcessing(false);
    router.push(`/?authMessage=${encodeURIComponent("탈퇴가 완료되었습니다.")}`);
    router.refresh();
  }

  return (
    <section className="danga-panel space-y-3 border-rose-200 p-5">
      <h2 className="text-base font-bold text-rose-700">계정 위험 구역</h2>
      <p className="text-sm text-slate-600">
        계정 탈퇴를 누르면 프로필이 soft delete 처리되고, 즉시 로그아웃됩니다.
      </p>

      <button
        type="button"
        onClick={() => {
          void handleWithdrawal();
        }}
        disabled={isProcessing}
        className="rounded-full border border-rose-300 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isProcessing ? "탈퇴 처리 중..." : "계정 탈퇴"}
      </button>

      {message ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}
