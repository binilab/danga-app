"use client";

import {
  formatReportStatusLabel,
  formatReportTargetLabel,
  REPORT_STATUSES,
  type ReportStatusFilter,
  getReportStatusClass,
} from "@/lib/reports";
import { type AdminReportItem, toShortUserLabel } from "@/lib/admin";
import { formatPostDate } from "@/lib/posts";

type ReportsTableProps = {
  rows: AdminReportItem[];
  selectedReportId: string | null;
  statusFilter: ReportStatusFilter;
  onChangeFilter: (next: ReportStatusFilter) => void;
  onSelect: (reportId: string) => void;
};

/**
 * 관리자 신고 목록을 필터/선택 가능한 테이블 UI로 렌더링합니다.
 */
export function ReportsTable({
  rows,
  selectedReportId,
  statusFilter,
  onChangeFilter,
  onSelect,
}: ReportsTableProps) {
  return (
    <section className="danga-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">신고 목록</h2>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          상태 필터
          <select
            value={statusFilter}
            onChange={(event) => {
              onChangeFilter(event.target.value as ReportStatusFilter);
            }}
            className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-sm text-slate-700"
          >
            <option value="all">전체</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatReportStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-slate-500">
          조건에 맞는 신고가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const isActive = row.id === selectedReportId;

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  isActive
                    ? "border-slate-700 bg-slate-50"
                    : "border-[var(--line)] bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-600">{formatPostDate(row.createdAt)}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${getReportStatusClass(row.status)}`}
                  >
                    {formatReportStatusLabel(row.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {formatReportTargetLabel(row.targetType)} #{row.targetId.slice(0, 8)}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {row.targetSummary ?? "삭제되었거나 조회할 수 없는 대상입니다."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  신고자:{" "}
                  {row.reporterName
                    ? row.reporterEmail
                      ? `${row.reporterName} (${row.reporterEmail})`
                      : row.reporterName
                    : toShortUserLabel(row.reporterId)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
