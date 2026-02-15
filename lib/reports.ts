export const REPORT_TARGET_TYPES = ["post", "comment"] as const;
export const REPORT_STATUSES = ["open", "reviewing", "resolved", "rejected"] as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportStatusFilter = ReportStatus | "all";

export type ReportRow = {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
};

/**
 * 문자열 값이 신고 대상 타입(post/comment)인지 검사합니다.
 */
export function isReportTargetType(value: string): value is ReportTargetType {
  return REPORT_TARGET_TYPES.includes(value as ReportTargetType);
}

/**
 * 문자열 값이 신고 상태(open/reviewing/resolved/rejected)인지 검사합니다.
 */
export function isReportStatus(value: string): value is ReportStatus {
  return REPORT_STATUSES.includes(value as ReportStatus);
}

/**
 * URL/폼 값에서 상태 필터를 안전한 타입으로 변환합니다.
 */
export function toReportStatusFilter(value: string | undefined): ReportStatusFilter {
  if (!value || value === "all") {
    return "all";
  }

  return isReportStatus(value) ? value : "all";
}

/**
 * 신고 사유 길이(5~300자)를 검사하고 오류 메시지를 반환합니다.
 */
export function validateReportReason(reason: string) {
  const trimmed = reason.trim();

  if (trimmed.length < 5) {
    return "신고 사유는 최소 5자 이상 입력해주세요.";
  }

  if (trimmed.length > 300) {
    return "신고 사유는 최대 300자까지 입력할 수 있습니다.";
  }

  return null;
}

/**
 * 중복 신고 unique 제약 위반 오류인지 판단합니다.
 */
export function isDuplicateReportError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "23505" ||
    error.message?.toLowerCase().includes("duplicate key") === true ||
    error.message?.includes("reports_unique_once") === true
  );
}

/**
 * 상태 코드를 사람이 읽기 쉬운 한글 라벨로 변환합니다.
 */
export function formatReportStatusLabel(status: ReportStatus) {
  if (status === "open") {
    return "접수";
  }

  if (status === "reviewing") {
    return "검토중";
  }

  if (status === "resolved") {
    return "처리완료";
  }

  return "반려";
}

/**
 * 상태 코드에 맞는 배지 스타일 클래스를 반환합니다.
 */
export function getReportStatusClass(status: ReportStatus) {
  if (status === "open") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "reviewing") {
    return "bg-sky-100 text-sky-700";
  }

  if (status === "resolved") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-200 text-slate-700";
}

/**
 * 신고 대상 타입을 화면 표시용 텍스트로 변환합니다.
 */
export function formatReportTargetLabel(targetType: ReportTargetType) {
  return targetType === "post" ? "게시글" : "댓글";
}
