import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateCommentBody } from "@/lib/comments";
import { logDevError } from "@/lib/log";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreateCommentBody = {
  postId?: string;
  body?: string;
  parentId?: string | null;
};

/**
 * 댓글 생성 성공 시 게시글 작성자 알림을 만드는 RPC를 호출합니다.
 */
async function notifyCommentCreated({
  supabase,
  postId,
  commentId,
  actorId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  postId: string;
  commentId: string;
  actorId: string;
}) {
  const { error } = await supabase.rpc("notify_comment", {
    p_post_id: postId,
    p_comment_id: commentId,
    p_actor_id: actorId,
  });

  if (error) {
    logDevError("[comments.notify_comment] failed", { message: error.message, code: error.code });
  }
}

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

  const normalizedParentId =
    typeof body.parentId === "string" && body.parentId.trim().length > 0
      ? body.parentId.trim()
      : null;

  if (normalizedParentId && !isValidUuid(normalizedParentId)) {
    return NextResponse.json(
      { ok: false, message: "부모 댓글 ID가 올바르지 않습니다." },
      { status: 400 },
    );
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

  let parentComment: { id: string; user_id: string; depth: number } | null = null;

  if (normalizedParentId) {
    const { data: parentData, error: parentError } = await supabase
      .from("comments")
      .select("id, user_id, depth")
      .eq("id", normalizedParentId)
      .eq("post_id", body.postId)
      .is("deleted_at", null)
      .maybeSingle();

    if (parentError || !parentData) {
      return NextResponse.json(
        { ok: false, message: "답글 대상 댓글을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (parentData.depth !== 0) {
      return NextResponse.json(
        { ok: false, message: "대댓글에는 다시 답글을 달 수 없습니다." },
        { status: 400 },
      );
    }

    parentComment = parentData as { id: string; user_id: string; depth: number };
  }

  const insertPayload = {
    post_id: body.postId,
    user_id: user.id,
    body: bodyValidation.value,
    parent_id: parentComment ? parentComment.id : null,
    depth: parentComment ? 1 : 0,
    reply_to_user_id: parentComment ? parentComment.user_id : null,
  };

  const { data: commentData, error: insertError } = await supabase
    .from("comments")
    .insert(insertPayload)
    .select("id, post_id, user_id, body, parent_id, depth, reply_to_user_id, created_at, deleted_at")
    .single();

  if (insertError || !commentData) {
    return NextResponse.json(
      { ok: false, message: "댓글 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  await notifyCommentCreated({
    supabase,
    postId: body.postId,
    commentId: commentData.id,
    actorId: user.id,
  });

  return NextResponse.json({
    ok: true,
    comment: commentData,
  });
}

/**
 * 본인 댓글을 soft delete 처리하는 API입니다.
 */
export async function DELETE(request: Request) {
  const requestUrl = new URL(request.url);
  const commentId = requestUrl.searchParams.get("commentId")?.trim();

  if (!commentId || !isValidUuid(commentId)) {
    return NextResponse.json(
      { ok: false, message: "댓글 ID가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "댓글 삭제는 로그인 후 사용할 수 있습니다." },
      { status: 401 },
    );
  }

  const { data: deletedComment, error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, message: "댓글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  if (!deletedComment) {
    return NextResponse.json(
      { ok: false, message: "삭제할 댓글이 없거나 권한이 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
