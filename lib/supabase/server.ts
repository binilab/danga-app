import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버에서 사용할 Supabase 환경 변수를 읽고 유효성을 검사합니다.
 */
function getSupabaseServerEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경 변수가 비어 있습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.",
    );
  }

  return { url, anonKey };
}

/**
 * 서버 컴포넌트/라우트 핸들러에서 사용할 Supabase 서버 클라이언트를 생성합니다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseServerEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // 서버 컴포넌트 렌더링 중에는 쿠키 쓰기가 제한될 수 있어 조용히 무시합니다.
        }
      },
    },
  });
}
