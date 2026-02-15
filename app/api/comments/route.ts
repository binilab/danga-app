import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateCommentBody } from "@/lib/comments";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreateCommentBody = {
  postId?: string;
  body?: string;
};

/**
 * 댓글 생성 요청 본문(JSON)을 읽고 실패하면 null을 반환합니다.
 */
async function readBody(request: Request) {
  try {
    return (await request.json()) as CreateCommentBody;
  } catch {
    return null;
  }
}

/**
 * 댓글 API에서 사용할 UUID 문자열 형식을 검사합니다.
 */
function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

/**
 * 게시글 댓글을 생성하는 API입니다.
 */
export async function POST(request: Request) {
  const body = await readBody(request);

  if (!body) {
    return NextResponse.json(
      { ok: false, message: "요청 본문(JSON)을 읽지 못했습니다." },
      { status: 400 },
    );
  }

  if (!body.postId || !isValidUuid(body.postId)) {
    return NextResponse.json(
      { ok: false, message: "게시글 ID가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const bodyValidation = validateCommentBody(body.body ?? "");

  if (!bodyValidation.ok) {
    return NextResponse.json({ ok: false, message: bodyValidation.message }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "댓글 작성은 로그인 후 사용할 수 있습니다." },
      { status: 401 },
    );
  }

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", body.postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (postError || !postData) {
    return NextResponse.json(
      { ok: false, message: "댓글 대상 게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const { data: commentData, error: insertError } = await supabase
    .from("comments")
    .insert({
      post_id: body.postId,
      user_id: user.id,
      body: bodyValidation.value,
    })
    .select("id, post_id, user_id, body, created_at, deleted_at")
    .single();

  if (insertError || !commentData) {
    return NextResponse.json(
      { ok: false, message: "댓글 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    comment: commentData,
  });
}
