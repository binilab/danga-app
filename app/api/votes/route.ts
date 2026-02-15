import { NextResponse } from "next/server";
import { logDevError } from "@/lib/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type VotePayload = {
  postId?: string;
};

/**
 * 요청 본문에서 postId를 읽어 UUID 형식 여부를 기본 검증합니다.
 */
function readPostId(payload: VotePayload) {
  const postId = payload.postId?.trim();

  if (!postId) {
    return { ok: false as const, message: "postId가 비어 있습니다." };
  }

  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidLike.test(postId)) {
    return { ok: false as const, message: "postId 형식이 올바르지 않습니다." };
  }

  return { ok: true as const, postId };
}

/**
 * 특정 게시글의 현재 좋아요 수를 계산합니다.
 */
async function countVotes(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, postId: string) {
  const { count, error } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    throw new Error("votes count 조회에 실패했습니다.");
  }

  return count ?? 0;
}

/**
 * 공통 처리: 세션 사용자 확인 + payload 검증 결과를 반환합니다.
 */
async function prepareRequest(request: Request) {
  const payload = (await request.json()) as VotePayload;
  const postIdResult = readPostId(payload);

  if (!postIdResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: postIdResult.message },
        { status: 400 },
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true as const,
    supabase,
    user,
    postId: postIdResult.postId,
  };
}

/**
 * 좋아요 생성: liked=false -> true 전환 동작
 */
export async function POST(request: Request) {
  try {
    const prepared = await prepareRequest(request);

    if (!prepared.ok) {
      return prepared.response;
    }

    const { supabase, user, postId } = prepared;
    const { error } = await supabase.from("votes").insert({
      post_id: postId,
      voter_id: user.id,
    });

    if (error && error.code !== "23505") {
      logDevError("[votes.insert] failed", { message: error.message, code: error.code });

      return NextResponse.json(
        { ok: false, message: "좋아요 저장에 실패했습니다." },
        { status: 500 },
      );
    }

    const count = await countVotes(supabase, postId);

    return NextResponse.json({ ok: true, likedByMe: true, count });
  } catch (error) {
    logDevError("[votes.insert] unexpected", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { ok: false, message: "좋아요 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/**
 * 좋아요 삭제: liked=true -> false 전환 동작
 */
export async function DELETE(request: Request) {
  try {
    const prepared = await prepareRequest(request);

    if (!prepared.ok) {
      return prepared.response;
    }

    const { supabase, user, postId } = prepared;
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("post_id", postId)
      .eq("voter_id", user.id);

    if (error) {
      logDevError("[votes.delete] failed", { message: error.message, code: error.code });

      return NextResponse.json(
        { ok: false, message: "좋아요 취소에 실패했습니다." },
        { status: 500 },
      );
    }

    const count = await countVotes(supabase, postId);

    return NextResponse.json({ ok: true, likedByMe: false, count });
  } catch (error) {
    logDevError("[votes.delete] unexpected", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { ok: false, message: "좋아요 취소 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
