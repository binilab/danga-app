import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isDuplicateReportError,
  isReportTargetType,
  validateReportReason,
} from "@/lib/reports";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreateReportBody = {
  targetType?: string;
  targetId?: string;
  reason?: string;
};

/**
 * 신고 생성 요청 본문을 읽고 형식 오류가 있으면 null을 반환합니다.
 */
async function readBody(request: Request) {
  try {
    return (await request.json()) as CreateReportBody;
  } catch {
    return null;
  }
}

/**
 * 신고 API에서 사용할 target id(UUID) 문자열 유효성을 검사합니다.
 */
function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

/**
 * 게시글/댓글 신고를 생성하는 API입니다.
 */
export async function POST(request: Request) {
  const body = await readBody(request);

  if (!body) {
    return NextResponse.json(
      { ok: false, message: "요청 본문(JSON)을 읽지 못했습니다." },
      { status: 400 },
    );
  }

  if (!body.targetType || !isReportTargetType(body.targetType)) {
    return NextResponse.json(
      { ok: false, message: "신고 대상 타입이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (!body.targetId || !isValidUuid(body.targetId)) {
    return NextResponse.json(
      { ok: false, message: "신고 대상 ID가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const reason = body.reason ?? "";
  const reasonError = validateReportReason(reason);

  if (reasonError) {
    return NextResponse.json({ ok: false, message: reasonError }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "로그인 후 신고할 수 있습니다." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      target_type: body.targetType,
      target_id: body.targetId,
      reporter_id: user.id,
      reason: reason.trim(),
    })
    .select("id")
    .single();

  if (error) {
    if (isDuplicateReportError(error)) {
      return NextResponse.json(
        { ok: false, message: "이미 신고했습니다." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, message: "신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
