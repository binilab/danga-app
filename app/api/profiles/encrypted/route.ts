import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { encryptProfileSensitiveFields } from "@/lib/crypto/profileSensitive";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * user_metadata에서 이름 후보 문자열을 우선순위대로 읽습니다.
 */
function getUserMetadataName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | null;

  if (!metadata) {
    return null;
  }

  const keys = ["full_name", "name", "nickname", "user_name"];

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/**
 * profiles 신규 생성 시 not null 제약을 만족하기 위한 닉네임 기본값을 계산합니다.
 */
function getFallbackNickname(user: User) {
  const metadataName = getUserMetadataName(user);

  if (metadataName) {
    return metadataName;
  }

  if (user.email) {
    return user.email.split("@")[0] ?? "danga_user";
  }

  return "danga_user";
}

/**
 * 로그인 사용자 이메일/이름을 profiles 암호화 컬럼(email_enc/name_enc)에 동기화합니다.
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "로그인 후 사용할 수 있습니다." },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    const encrypted = encryptProfileSensitiveFields({
      email: user.email ?? null,
      name: getUserMetadataName(user),
    });
    const nickname = profile?.nickname ?? getFallbackNickname(user);
    const avatarUrl = profile?.avatar_url ?? null;
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        nickname,
        avatar_url: avatarUrl,
        email_enc: encrypted.emailEnc,
        name_enc: encrypted.nameEnc,
      },
      { onConflict: "id" },
    );

    if (error) {
      return NextResponse.json(
        { ok: false, message: "암호화 프로필 저장에 실패했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "암호화 처리 중 알 수 없는 오류가 발생했습니다.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
