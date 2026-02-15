"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildAdminReviewUpdate,
  sortReportsByCreatedAtDesc,
  type AdminReportItem,
} from "@/lib/admin";
import { ReportDetail } from "@/components/admin/ReportDetail";
import { ReportsTable } from "@/components/admin/ReportsTable";
import { type ReportStatus, type ReportStatusFilter } from "@/lib/reports";

type AdminReportsClientProps = {
  initialReports: AdminReportItem[];
  adminUserId: string;
};

/**
 * 관리자 신고 목록의 필터/선택/상태 변경/조치 RPC 호출을 제어하는 컨테이너 컴포넌트입니다.
 */
export function AdminReportsClient({ initialReports, adminUserId }: AdminReportsClientProps) {
  const [reports, setReports] = useState(() => sortReportsByCreatedAtDesc(initialReports));
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    initialReports[0]?.id ?? null,
  );
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const supabase = createSupabaseBrowserClient();

  /**
   * 현재 필터 값에 맞는 신고 목록만 추려서 생성일 내림차순으로 제공합니다.
   */
  const filteredReports = useMemo(() => {
    const source =
      statusFilter === "all"
        ? reports
        : reports.filter((report) => report.status === statusFilter);

    return sortReportsByCreatedAtDesc(source);
  }, [reports, statusFilter]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId) {
      return filteredReports[0] ?? null;
    }

    return filteredReports.find((report) => report.id === selectedReportId) ?? null;
  }, [filteredReports, selectedReportId]);

  /**
   * 신고 상태/메모를 저장하고 리뷰 메타데이터(reviewed_by, reviewed_at)를 함께 기록합니다.
   */
  async function handleUpdate(payload: { status: ReportStatus; notes: string }) {
    if (!selectedReport) {
      return;
    }

    setIsUpdating(true);
    setMessage(null);
    setIsErrorMessage(false);

    const updateBody = buildAdminReviewUpdate({
      status: payload.status,
      notes: payload.notes,
      adminUserId,
    });

    const { data, error } = await supabase
      .from("reports")
      .update(updateBody)
      .eq("id", selectedReport.id)
      .select("id, status, reviewed_by, reviewed_at, notes")
      .single();

    if (error || !data) {
      setIsUpdating(false);
      setIsErrorMessage(true);
      setMessage("신고 상태 저장에 실패했습니다. 관리자 권한/정책을 확인해주세요.");
      return;
    }

    setReports((prev) =>
      prev.map((report) => {
        if (report.id !== selectedReport.id) {
          return report;
        }

        return {
          ...report,
          status: data.status as ReportStatus,
          reviewedBy: data.reviewed_by as string | null,
          reviewedAt: data.reviewed_at as string | null,
          notes: data.notes as string | null,
        };
      }),
    );
    setIsUpdating(false);
    setIsErrorMessage(false);
    setMessage("신고 상태를 저장했습니다.");
  }

  /**
   * 신고 대상 타입에 맞는 관리자 soft delete RPC를 호출해 콘텐츠를 숨김 처리합니다.
   */
  async function handleRunAction() {
    if (!selectedReport) {
      return;
    }

    setIsActionRunning(true);
    setMessage(null);
    setIsErrorMessage(false);

    if (selectedReport.targetType === "post") {
      const { error } = await supabase.rpc("admin_soft_delete_post", {
        p_post_id: selectedReport.targetId,
      });

      if (error) {
        setIsActionRunning(false);
        setIsErrorMessage(true);
        setMessage("게시글 숨김 처리에 실패했습니다.");
        return;
      }
    } else {
      const { error } = await supabase.rpc("admin_soft_delete_comment", {
        p_comment_id: selectedReport.targetId,
      });

      if (error) {
        setIsActionRunning(false);
        setIsErrorMessage(true);
        setMessage("댓글 숨김 처리에 실패했습니다.");
        return;
      }
    }

    setReports((prev) =>
      prev.map((report) => {
        if (report.id !== selectedReport.id) {
          return report;
        }

        return {
          ...report,
          targetDeletedAt: new Date().toISOString(),
        };
      }),
    );
    setIsActionRunning(false);
    setIsErrorMessage(false);
    setMessage("신고 대상 숨김 처리를 완료했습니다.");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <ReportsTable
        rows={filteredReports}
        selectedReportId={selectedReport?.id ?? null}
        statusFilter={statusFilter}
        onChangeFilter={(next) => {
          setStatusFilter(next);
          setSelectedReportId(null);
        }}
        onSelect={(reportId) => setSelectedReportId(reportId)}
      />
      <ReportDetail
        key={selectedReport?.id ?? "empty"}
        report={selectedReport}
        isUpdating={isUpdating}
        isActionRunning={isActionRunning}
        message={message}
        isErrorMessage={isErrorMessage}
        onUpdate={handleUpdate}
        onRunAction={handleRunAction}
      />
    </section>
  );
}
