"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileEditorProps = {
  userId: string;
  initialNickname: string;
  initialAvatarUrl: string | null;
};

/**
 * 닉네임 입력값을 정규화하고 최소 길이를 만족하는지 검증합니다.
 */
function validateNickname(value: string) {
  const trimmed = value.trim();

  if (trimmed.length < 2) {
    return {
      ok: false,
      message: "닉네임은 2자 이상 입력해주세요.",
      value: trimmed,
    } as const;
  }

  if (trimmed.length > 24) {
    return {
      ok: false,
      message: "닉네임은 24자 이하로 입력해주세요.",
      value: trimmed,
    } as const;
  }

  return { ok: true, value: trimmed } as const;
}

/**
 * /me 페이지에서 프로필(닉네임/아바타 URL)을 수정하는 폼 컴포넌트입니다.
 */
export function ProfileEditor({
  userId,
  initialNickname,
  initialAvatarUrl,
}: ProfileEditorProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [nickname, setNickname] = useState(initialNickname);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  /**
   * 입력한 프로필 값을 저장하고 완료 시 헤더/페이지를 새 데이터로 갱신합니다.
   */
  async function handleSave() {
    const validation = validateNickname(nickname);

    if (!validation.ok) {
      setIsError(true);
      setMessage(validation.message);
      return;
    }

    setIsSaving(true);
    setIsError(false);
    setMessage(null);

    const normalizedAvatarUrl = avatarUrl.trim() ? avatarUrl.trim() : null;
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        nickname: validation.value,
        avatar_url: normalizedAvatarUrl,
      },
      { onConflict: "id" },
    );

    if (error) {
      setIsSaving(false);
      setIsError(true);
      setMessage("프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setNickname(validation.value);
    setAvatarUrl(normalizedAvatarUrl ?? "");
    setIsSaving(false);
    setIsError(false);
    setMessage("프로필이 저장되었습니다.");
    window.dispatchEvent(new Event("danga:refresh-header-user"));
    router.refresh();
  }

  return (
    <section className="danga-panel space-y-3 p-5">
      <h2 className="text-base font-bold text-slate-900">프로필 편집</h2>
      <p className="text-sm text-slate-600">
        닉네임과 아바타 URL을 수정하면 헤더/마이페이지에 반영됩니다.
      </p>

      <div className="space-y-2">
        <label htmlFor="profile-nickname" className="text-sm font-semibold text-slate-700">
          닉네임
        </label>
        <input
          id="profile-nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
          placeholder="닉네임을 입력하세요"
          maxLength={24}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-avatar-url" className="text-sm font-semibold text-slate-700">
          아바타 URL (선택)
        </label>
        <input
          id="profile-avatar-url"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
          placeholder="https://..."
        />
      </div>

      <button
        type="button"
        onClick={() => {
          void handleSave();
        }}
        disabled={isSaving}
        className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "저장 중..." : "프로필 저장"}
      </button>

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            isError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
