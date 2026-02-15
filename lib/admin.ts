import type { ReportRow, ReportStatus } from "@/lib/reports";

export type AdminProfileRow = {
  role: string | null;
  deleted_at: string | null;
};

export type AdminPostTargetRow = {
  id: string;
  caption: string;
  deleted_at: string | null;
};

export type AdminCommentTargetRow = {
  id: string;
  body: string;
  post_id: string;
  deleted_at: string | null;
};

export type AdminReportItem = {
  id: string;
  targetType: ReportRow["target_type"];
  targetId: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  targetSummary: string | null;
  targetDeletedAt: string | null;
  targetPostIdForComment: string | null;
};

/**
 * profiles 행을 기반으로 현재 사용자가 관리자 권한인지 판별합니다.
 */
export function isAdminProfile(profile: AdminProfileRow | null) {
  if (!profile) {
    return false;
  }

  return profile.role === "admin" && profile.deleted_at === null;
}

/**
 * 신고 목록을 생성일 기준 내림차순으로 정렬합니다.
 */
export function sortReportsByCreatedAtDesc(items: AdminReportItem[]) {
  return [...items].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * reports + target(posts/comments) 데이터를 관리자 화면용 단일 구조로 결합합니다.
 */
export function buildAdminReportItems({
  reports,
  posts,
  comments,
}: {
  reports: ReportRow[];
  posts: AdminPostTargetRow[];
  comments: AdminCommentTargetRow[];
}) {
  const postMap = new Map(posts.map((post) => [post.id, post]));
  const commentMap = new Map(comments.map((comment) => [comment.id, comment]));

  return reports.map((report) => {
    if (report.target_type === "post") {
      const post = postMap.get(report.target_id);

      return {
        id: report.id,
        targetType: "post",
        targetId: report.target_id,
        reporterId: report.reporter_id,
        reason: report.reason,
        status: report.status,
        createdAt: report.created_at,
        reviewedBy: report.reviewed_by,
        reviewedAt: report.reviewed_at,
        notes: report.notes,
        targetSummary: post?.caption ?? null,
        targetDeletedAt: post?.deleted_at ?? null,
        targetPostIdForComment: null,
      } satisfies AdminReportItem;
    }

    const comment = commentMap.get(report.target_id);

    return {
      id: report.id,
      targetType: "comment",
      targetId: report.target_id,
      reporterId: report.reporter_id,
      reason: report.reason,
      status: report.status,
      createdAt: report.created_at,
      reviewedBy: report.reviewed_by,
      reviewedAt: report.reviewed_at,
      notes: report.notes,
      targetSummary: comment?.body ?? null,
      targetDeletedAt: comment?.deleted_at ?? null,
      targetPostIdForComment: comment?.post_id ?? null,
    } satisfies AdminReportItem;
  });
}

/**
 * 신고 처리 상태 변경 시 저장할 관리자 리뷰 메타데이터를 만듭니다.
 */
export function buildAdminReviewUpdate({
  status,
  notes,
  adminUserId,
}: {
  status: ReportStatus;
  notes: string;
  adminUserId: string;
}) {
  return {
    status,
    notes: notes.trim() ? notes.trim() : null,
    reviewed_by: adminUserId,
    reviewed_at: new Date().toISOString(),
  };
}

/**
 * 표시용 사용자 식별자를 짧은 라벨 형태로 변환합니다.
 */
export function toShortUserLabel(userId: string) {
  return `user_${userId.slice(0, 8)}`;
}
