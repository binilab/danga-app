import Link from "next/link";

const policyLinks = [
  { href: "/privacy", label: "개인정보 처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/contact", label: "문의" },
];

/**
 * 전체 페이지 하단에 공통으로 노출되는 정책/문의 링크 푸터입니다.
 */
export function Footer() {
  return (
    <footer className="mt-14 border-t border-[var(--line)] bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            DANGA · 단번에 가자, 나이스 패션이다
          </p>
          <p className="mt-1 text-xs text-slate-500">
            © {new Date().getFullYear()} DANGA. 코디 평가를 한 번에.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          {policyLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-[var(--line)] hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
