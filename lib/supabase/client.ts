import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저에서 사용할 Supabase 환경 변수를 읽고 유효성을 검사합니다.
 */
function getSupabaseBrowserEnv() {
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
 * 클라이언트 컴포넌트에서 재사용할 Supabase 브라우저 클라이언트를 싱글턴으로 생성합니다.
 */
export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseBrowserEnv();
  browserClient = createBrowserClient(url, anonKey);

  return browserClient;
}
