import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";
import {
  buildAdminReportItems,
  isAdminProfile,
  sortReportsByCreatedAtDesc,
  type AdminCommentTargetRow,
  type AdminPostTargetRow,
  type AdminReporterIdentityRow,
} from "@/lib/admin";
import { decryptProfileSensitiveFields } from "@/lib/crypto/profileSensitive";
import { type ReportRow } from "@/lib/reports";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReporterSensitiveRow = {
  id: string;
  nickname: string | null;
  email_enc: string | null;
  name_enc: string | null;
};

/**
 * 암호화 컬럼이 손상되었거나 키가 잘못된 경우를 대비해 복호화 오류를 안전하게 무시합니다.
 */
function safeDecryptReporterIdentity(row: ReporterSensitiveRow) {
  try {
    const decrypted = decryptProfileSensitiveFields({
      emailEnc: row.email_enc,
      nameEnc: row.name_enc,
    });

    return {
      reporter_name: decrypted.name ?? row.nickname ?? null,
      reporter_email: decrypted.email ?? null,
    };
  } catch {
    return {
      reporter_name: row.nickname ?? null,
      reporter_email: null,
    };
  }
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * /admin 페이지에서 세션/권한 확인 후 신고 관리 화면을 렌더링합니다.
 */
export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Admin"
          description="관리자 페이지는 로그인 후 접근할 수 있습니다."
        />
        <section className="danga-panel space-y-3 p-5 text-sm text-slate-600">
          <p>로그인이 필요합니다. 헤더의 로그인하고 시작 버튼으로 로그인해주세요.</p>
          <Link
            href="/"
            className="inline-flex rounded-full border border-[var(--line)] px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            랜딩으로 이동
          </Link>
        </section>
      </div>
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminProfile((profileData as { role: string | null; deleted_at: string | null }) ?? null)) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Admin"
          description="이 계정은 관리자 권한이 없어 접근할 수 없습니다."
        />
        <section className="danga-panel space-y-3 p-5 text-sm text-slate-600">
          <p>운영 권한이 필요한 메뉴입니다. 필요한 경우 관리자에게 권한 요청을 해주세요.</p>
          <Link
            href="/"
            className="inline-flex rounded-full border border-[var(--line)] px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            랜딩으로 이동
          </Link>
        </section>
      </div>
    );
  }

  const { data: reportData, error: reportError } = await supabase
    .from("reports")
    .select(
      "id, target_type, target_id, reporter_id, reason, status, created_at, reviewed_by, reviewed_at, notes",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (reportError) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Admin"
          description="신고 데이터를 불러오는 중 오류가 발생했습니다."
        />
        <section className="danga-panel p-5 text-sm text-rose-700">
          reports 조회 권한 또는 정책(RLS)을 확인해주세요.
        </section>
      </div>
    );
  }

  const reports = (reportData ?? []) as ReportRow[];
  const postTargetIds = reports
    .filter((report) => report.target_type === "post")
    .map((report) => report.target_id);
  const commentTargetIds = reports
    .filter((report) => report.target_type === "comment")
    .map((report) => report.target_id);
  const reporterIds = Array.from(new Set(reports.map((report) => report.reporter_id)));

  const { data: postTargetData } =
    postTargetIds.length > 0
      ? await supabase
          .from("posts")
          .select("id, caption, deleted_at")
          .in("id", postTargetIds)
      : { data: [] as unknown[] };
  const { data: commentTargetData } =
    commentTargetIds.length > 0
      ? await supabase
          .from("comments")
          .select("id, body, post_id, deleted_at")
          .in("id", commentTargetIds)
      : { data: [] as unknown[] };
  const { data: reporterSensitiveData } =
    reporterIds.length > 0
      ? await supabase.rpc("admin_list_profile_identities", {
          p_user_ids: reporterIds,
        })
      : { data: [] as unknown[] };
  const reporterIdentities = ((reporterSensitiveData ?? []) as ReporterSensitiveRow[]).map(
    (row) => {
      const decrypted = safeDecryptReporterIdentity(row);

      return {
        id: row.id,
        reporter_name: decrypted.reporter_name,
        reporter_email: decrypted.reporter_email,
      } satisfies AdminReporterIdentityRow;
    },
  );

  const initialReports = sortReportsByCreatedAtDesc(
    buildAdminReportItems({
      reports,
      posts: (postTargetData ?? []) as AdminPostTargetRow[],
      comments: (commentTargetData ?? []) as AdminCommentTargetRow[],
      reporterIdentities,
    }),
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Admin"
        description="신고 접수 현황을 검토하고 상태 변경 및 콘텐츠 숨김 처리를 수행합니다."
      />
      <AdminReportsClient initialReports={initialReports} adminUserId={user.id} />
    </div>
  );
}
