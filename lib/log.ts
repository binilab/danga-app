/**
 * 운영 환경에서는 로그를 줄이고, 개발 환경에서만 디버깅 로그를 출력합니다.
 */
export function logDevError(scope: string, payload?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(scope, payload);
  }
}
