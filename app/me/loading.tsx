/**
 * /me 서버 데이터 로딩 중 사용자에게 보여줄 간단한 스켈레톤 UI입니다.
 */
export default function MeLoading() {
  return (
    <div className="space-y-4">
      <div className="danga-panel h-24 animate-pulse bg-slate-100" />
      <div className="danga-panel h-40 animate-pulse bg-slate-100" />
      <div className="danga-panel h-40 animate-pulse bg-slate-100" />
    </div>
  );
}
