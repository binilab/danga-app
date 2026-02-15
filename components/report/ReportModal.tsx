"use client";

import { useEffect, useState } from "react";
import { formatReportTargetLabel, type ReportTargetType, validateReportReason } from "@/lib/reports";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  isLoggedIn: boolean;
  onSuccess?: () => void;
};

type ReportApiResponse =
  | {
      ok: true;
      id: string | null;
    }
  | {
      ok: false;
      message: string;
    };

/**
 * 신고 API 응답 본문을 JSON 형태로 읽고 실패하면 null을 반환합니다.
 */
async function readReportResponse(response: Response) {
  try {
    return (await response.json()) as ReportApiResponse;
  } catch {
    return null;
  }
}

/**
 * 로그인 모달 오픈 이벤트를 헤더로 전달합니다.
 */
function openLoginModal(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("danga:open-login", { detail: { message } }));
}

/**
 * 게시글/댓글 신고 사유를 입력받아 서버로 전송하는 공통 모달입니다.
 */
export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  isLoggedIn,
  onSuccess,
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  /**
   * 모달이 닫히면 입력 상태를 초기화해 다음 신고 시 깨끗한 폼을 제공합니다.
   */
  useEffect(() => {
    if (isOpen) {
      return;
    }

    setReason("");
    setMessage(null);
    setIsError(false);
    setIsSubmitting(false);
  }, [isOpen]);

  /**
   * ESC 키를 누르면 신고 모달을 닫습니다.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  /**
   * 신고 요청을 서버 API로 전송하고 성공/실패 안내를 모달에 표시합니다.
   */
  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    if (!isLoggedIn) {
      const loginMessage = "신고 기능은 로그인 후 사용할 수 있습니다.";
      setIsError(true);
      setMessage(loginMessage);
      openLoginModal(loginMessage);
      return;
    }

    const reasonError = validateReportReason(reason);

    if (reasonError) {
      setIsError(true);
      setMessage(reasonError);
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setMessage(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: reason.trim(),
        }),
      });
      const result = await readReportResponse(response);

      if (!response.ok || !result || !result.ok) {
        const fallbackMessage =
          result && "message" in result
            ? result.message
            : "신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.";

        setIsError(true);
        setMessage(fallbackMessage);
        return;
      }

      setIsError(false);
      setMessage("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
      onSuccess?.();
    } catch {
      setIsError(true);
      setMessage("네트워크 오류로 신고 접수에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {formatReportTargetLabel(targetType)} 신고
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              신고 사유를 구체적으로 입력해주세요. (5자 ~ 300자)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="report-reason" className="text-sm font-semibold text-slate-700">
            신고 사유
          </label>
          <textarea
            id="report-reason"
            rows={5}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
            placeholder="예: 욕설/비방, 광고성 게시물, 부적절한 콘텐츠 등"
            maxLength={300}
          />
          <p className="text-right text-xs text-slate-500">{reason.trim().length}/300</p>
        </div>

        {message ? (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
              isError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "신고 중..." : "신고 접수"}
          </button>
        </div>
      </div>
    </div>
  );
}
