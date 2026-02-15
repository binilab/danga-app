"use client";

import { useState } from "react";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

type UploadSuccess = {
  ok: true;
  key: string;
  url: string;
  signedUrl: string;
};

type UploadFailure = {
  ok: false;
  message: string;
};

type UploadResponse = UploadSuccess | UploadFailure;

/**
 * 바이트 값을 사람이 읽기 쉬운 MB 단위 문자열로 변환합니다.
 */
function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * 업로더에서 선택한 파일의 기본 유효성을 클라이언트에서 먼저 검사합니다.
 */
function validateFile(file: File | null) {
  if (!file) {
    return "먼저 업로드할 이미지를 선택해주세요.";
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "PNG, JPEG, WEBP 이미지 파일만 업로드할 수 있습니다.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `파일이 너무 큽니다. 최대 ${formatMegabytes(MAX_IMAGE_SIZE_BYTES)}까지 업로드할 수 있습니다.`;
  }

  return null;
}

/**
 * 응답 본문을 JSON 우선으로 읽고 실패하면 텍스트로 대체합니다.
 */
async function readUploadResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return (await response.json()) as UploadResponse;
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return { ok: false, message: text.slice(0, 160) } satisfies UploadFailure;
  } catch {
    return null;
  }
}

/**
 * /post/new 페이지에서 사용하는 R2 이미지 업로더 UI 컴포넌트입니다.
 */
export function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  /**
   * 파일 선택 시 기존 결과를 초기화하고 새 파일을 상태로 저장합니다.
   */
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setUploadedUrl(null);
    setSignedPreviewUrl(null);
    setUploadedKey(null);
    setErrorMessage(null);
    setCopyMessage(null);
  }

  /**
   * 선택한 파일을 서버 업로드 API로 전송하고 결과를 화면에 반영합니다.
   */
  async function handleUpload() {
    setErrorMessage(null);
    setCopyMessage(null);

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const fileToUpload = selectedFile;

    if (!fileToUpload) {
      setErrorMessage("파일 상태를 다시 확인해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      setIsUploading(true);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await readUploadResponse(response);

      if (!response.ok) {
        const fallbackMessage =
          result && "message" in result
            ? result.message
            : `업로드 서버 오류(${response.status})가 발생했습니다.`;

        setErrorMessage(fallbackMessage);
        return;
      }

      if (!result || !result.ok) {
        setErrorMessage("업로드 응답을 해석하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setUploadedUrl(result.url);
      setSignedPreviewUrl(result.signedUrl);
      setUploadedKey(result.key);
    } catch {
      setErrorMessage("네트워크 오류로 업로드에 실패했습니다. 연결 상태를 확인해주세요.");
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * 업로드가 끝난 URL을 클립보드에 복사하고 결과 문구를 표시합니다.
   */
  async function handleCopyUrl() {
    const copyTarget = signedPreviewUrl ?? uploadedUrl;

    if (!copyTarget) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyTarget);
      setCopyMessage("URL을 복사했습니다.");
    } catch {
      setCopyMessage("복사에 실패했습니다. URL을 직접 선택해 복사해주세요.");
    }
  }

  return (
    <section className="danga-panel space-y-4 p-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">이미지 업로드 (R2)</h2>
        <p className="mt-1 text-sm text-slate-600">
          지원 형식: PNG/JPEG/WEBP, 최대 {formatMegabytes(MAX_IMAGE_SIZE_BYTES)}
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-700"
        />

        {selectedFile ? (
          <p className="text-xs text-slate-500">
            선택 파일: {selectedFile.name} ({formatMegabytes(selectedFile.size)})
          </p>
        ) : null}

        <button
          type="button"
          disabled={isUploading}
          onClick={() => {
            void handleUpload();
          }}
          className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "업로드 중..." : "이미지 업로드"}
        </button>
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {uploadedUrl ? (
        <div className="space-y-3 rounded-xl border border-[var(--line)] bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">업로드 성공</p>

          <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedPreviewUrl ?? uploadedUrl}
              alt="업로드된 이미지 미리보기"
              className="h-auto max-h-80 w-full object-contain"
            />
          </div>

          {uploadedKey ? (
            <p className="text-xs text-slate-500 break-all">R2 Key: {uploadedKey}</p>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">이미지 URL</p>
            <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs text-slate-700 break-all">
              {uploadedUrl}
            </div>
            {signedPreviewUrl && signedPreviewUrl !== uploadedUrl ? (
              <>
                <p className="text-xs font-semibold text-slate-600">
                  임시 미리보기 URL (1시간)
                </p>
                <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs text-slate-700 break-all">
                  {signedPreviewUrl}
                </div>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void handleCopyUrl();
              }}
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              URL 복사
            </button>
            {copyMessage ? <p className="text-xs text-slate-500">{copyMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
