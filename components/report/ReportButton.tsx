"use client";

import { useState } from "react";
import { ReportModal } from "@/components/report/ReportModal";
import { type ReportTargetType } from "@/lib/reports";

type ReportButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  isLoggedIn: boolean;
  label?: string;
  className?: string;
};

/**
 * 신고 버튼 클릭 시 모달을 열고 성공 안내 문구까지 관리하는 래퍼 컴포넌트입니다.
 */
export function ReportButton({
  targetType,
  targetId,
  isLoggedIn,
  label = "신고",
  className,
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          setSuccessMessage(null);
          setIsOpen(true);
        }}
        className={
          className ??
          "rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        }
      >
        {label}
      </button>

      {successMessage ? <p className="text-xs text-emerald-700">{successMessage}</p> : null}

      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetType={targetType}
        targetId={targetId}
        isLoggedIn={isLoggedIn}
        onSuccess={() => {
          setSuccessMessage("신고가 접수되었습니다.");
        }}
      />
    </div>
  );
}
