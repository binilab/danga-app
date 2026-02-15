import Link from "next/link";

type SearchFormProps = {
  defaultQuery?: string;
  activeTag?: string | null;
  className?: string;
};

/**
 * 키워드 검색 입력을 받아 /search로 이동하는 공통 검색 폼입니다.
 */
export function SearchForm({ defaultQuery = "", activeTag = null, className }: SearchFormProps) {
  return (
    <div className={className}>
      <form
        action="/search"
        method="get"
        className="danga-panel flex flex-wrap items-center gap-2 p-3"
      >
        <input
          name="q"
          defaultValue={defaultQuery}
          placeholder="코디 설명 검색 (Enter)"
          className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
        />
        {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
        <button
          type="submit"
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
        >
          검색
        </button>
      </form>

      {activeTag ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <span>현재 태그 필터:</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
            #{activeTag}
          </span>
          <Link
            href={defaultQuery ? `/search?q=${encodeURIComponent(defaultQuery)}` : "/search"}
            className="font-semibold text-[var(--brand)] hover:underline"
          >
            태그 해제
          </Link>
        </div>
      ) : null}
    </div>
  );
}
