"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPostDate } from "@/lib/posts";
import {
  formatReportStatusLabel,
  formatReportTargetLabel,
  REPORT_STATUSES,
  type ReportStatus,
  getReportStatusClass,
} from "@/lib/reports";
import { type AdminReportItem, toShortUserLabel } from "@/lib/admin";

type ReportDetailProps = {
  report: AdminReportItem | null;
  isUpdating: boolean;
  isActionRunning: boolean;
  message: string | null;
  isErrorMessage: boolean;
  onUpdate: (payload: { status: ReportStatus; notes: string }) => Promise<void>;
  onRunAction: () => Promise<void>;
};

/**
 * 신고 타입에 맞는 대상 링크 경로를 계산합니다.
 */
function resolveTargetHref(report: AdminReportItem) {
  if (report.targetType === "post") {
    return `/p/${report.targetId}`;
  }

  if (report.targetPostIdForComment) {
    return `/p/${report.targetPostIdForComment}`;
  }

  return null;
}

/**
 * 신고 대상 soft delete 조치 버튼 라벨을 생성합니다.
 */
function getActionLabel(report: AdminReportItem) {
  return report.targetType === "post" ? "게시글 숨김 처리" : "댓글 숨김 처리";
}

/**
 * 선택한 신고 건의 상세 내용과 상태 변경/조치 버튼을 제공합니다.
 */
export function ReportDetail({
  report,
  isUpdating,
  isActionRunning,
  message,
  isErrorMessage,
  onUpdate,
  onRunAction,
}: ReportDetailProps) {
  const [status, setStatus] = useState<ReportStatus>(report?.status ?? "open");
  const [notes, setNotes] = useState(report?.notes ?? "");

  if (!report) {
    return (
      <section className="danga-panel p-4 text-sm text-slate-600">
        왼쪽 목록에서 신고 항목을 선택하면 상세 정보를 확인할 수 있습니다.
      </section>
    );
  }

  const targetHref = resolveTargetHref(report);

  return (
    <section className="danga-panel space-y-4 p-4">
      <div className="space-y-2">
        <h2 className="text-base font-bold text-slate-900">신고 상세</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {formatReportTargetLabel(report.targetType)}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${getReportStatusClass(report.status)}`}
          >
            {formatReportStatusLabel(report.status)}
          </span>
          {report.targetDeletedAt ? (
            <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
              숨김 처리됨
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--line)] bg-slate-50 p-3">
        <p className="text-xs text-slate-500">
          신고자:{" "}
          {report.reporterName
            ? report.reporterEmail
              ? `${report.reporterName} (${report.reporterEmail})`
              : report.reporterName
            : toShortUserLabel(report.reporterId)}{" "}
          · 접수: {formatPostDate(report.createdAt)}
        </p>
        <p className="text-sm font-semibold text-slate-800">신고 사유</p>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{report.reason}</p>
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--line)] bg-white p-3">
        <p className="text-sm font-semibold text-slate-800">대상 미리보기</p>
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {report.targetSummary ?? "삭제되었거나 조회할 수 없는 대상입니다."}
        </p>
        {targetHref ? (
          <Link href={targetHref} className="text-xs font-semibold text-[var(--brand)] hover:underline">
            대상 게시글 보기
          </Link>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="report-status">
          상태
        </label>
        <select
          id="report-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as ReportStatus)}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-700"
        >
          {REPORT_STATUSES.map((statusValue) => (
            <option key={statusValue} value={statusValue}>
              {formatReportStatusLabel(statusValue)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="report-notes">
          관리자 메모
        </label>
        <textarea
          id="report-notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
          placeholder="내부 처리 메모를 입력하세요."
        />
      </div>

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            isErrorMessage ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => {
            void onUpdate({ status, notes });
          }}
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdating ? "저장 중..." : "상태 저장"}
        </button>
        <button
          type="button"
          disabled={isActionRunning}
          onClick={() => {
            void onRunAction();
          }}
          className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isActionRunning ? "처리 중..." : getActionLabel(report)}
        </button>
      </div>
    </section>
  );
}
