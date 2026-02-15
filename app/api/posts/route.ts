import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreatePostPayload = {
  imageUrl?: string;
  imageKey?: string | null;
  caption?: string;
};

/**
 * 게시글 생성 요청 본문을 검증하고 저장 가능한 형태로 정리합니다.
 */
function validateCreatePayload(payload: CreatePostPayload) {
  const imageUrl = payload.imageUrl?.trim();
  const imageKey = payload.imageKey?.trim() ?? null;
  const caption = payload.caption?.trim();

  if (!imageUrl) {
    return { ok: false as const, message: "이미지 URL이 비어 있습니다." };
  }

  if (!caption) {
    return { ok: false as const, message: "캡션을 입력해주세요." };
  }

  if (caption.length > 500) {
    return { ok: false as const, message: "캡션은 500자 이하로 작성해주세요." };
  }

  return {
    ok: true as const,
    value: {
      imageUrl,
      imageKey,
      caption,
    },
  };
}

/**
 * 게시글 생성 API: 로그인 사용자의 이미지/캡션을 posts 테이블에 저장합니다.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreatePostPayload;
    const validated = validateCreatePayload(payload);

    if (!validated.ok) {
      return NextResponse.json({ ok: false, message: validated.message }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        image_url: validated.value.imageUrl,
        image_key: validated.value.imageKey,
        caption: validated.value.caption,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[posts.create] failed", { message: error.message, code: error.code });

      return NextResponse.json(
        { ok: false, message: "게시글을 저장하지 못했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("[posts.create] unexpected", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { ok: false, message: "게시글 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
