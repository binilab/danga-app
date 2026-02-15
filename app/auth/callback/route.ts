import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 외부 Redirect 값을 안전하게 처리하기 위해 내부 경로만 허용합니다.
 */
function getSafeNextPath(candidate: string | null): string {
  if (!candidate) {
    return "/";
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  return candidate;
}

/**
 * 인증 실패 메시지를 목적지 URL에 붙여 사용자에게 안내할 수 있게 만듭니다.
 */
function buildErrorRedirect(baseUrl: URL, nextPath: string, message: string) {
  const redirectUrl = new URL(nextPath, baseUrl.origin);
  redirectUrl.searchParams.set("authMessage", message);

  return NextResponse.redirect(redirectUrl);
}

/**
 * OAuth 콜백에서 code를 세션으로 교환하고 원래 페이지로 이동시킵니다.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    const message =
      errorDescription ?? "로그인이 취소되었거나 인증 과정에서 오류가 발생했습니다.";

    return buildErrorRedirect(requestUrl, nextPath, message);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return buildErrorRedirect(
        requestUrl,
        nextPath,
        "로그인 세션을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
