"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/State";
import { MAX_POST_TAGS, parseTagInput, validatePostTags } from "@/lib/tags";

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

type CreatePostSuccess = {
  ok: true;
  id: string;
};

type CreatePostFailure = {
  ok: false;
  message: string;
};

type CreatePostResponse = CreatePostSuccess | CreatePostFailure;

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
    return "먼저 이미지를 선택해주세요.";
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
 * 게시글 생성 API 응답을 JSON 형태로 읽습니다.
 */
async function readCreatePostResponse(response: Response) {
  try {
    return (await response.json()) as CreatePostResponse;
  } catch {
    return null;
  }
}

/**
 * /post/new 페이지에서 사용하는 이미지 업로드 + 게시글 작성 컴포넌트입니다.
 */
export function ImageUploader() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [tagsInput, setTagsInput] = useState("");
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
    setCaption("");
    setTagsInput("");
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

  /**
   * 업로드된 이미지 URL과 캡션을 posts 테이블에 저장하고 피드로 이동합니다.
   */
  async function handleCreatePost() {
    setErrorMessage(null);

    if (!uploadedUrl) {
      setErrorMessage("먼저 이미지를 업로드해주세요.");
      return;
    }

    if (!caption.trim()) {
      setErrorMessage("캡션을 입력해주세요.");
      return;
    }

    const parsedTags = parseTagInput(tagsInput);
    const tagValidationError = validatePostTags(parsedTags);

    if (tagValidationError) {
      setErrorMessage(tagValidationError);
      return;
    }

    try {
      setIsSubmittingPost(true);

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedUrl,
          imageKey: uploadedKey,
          caption,
          tags: parsedTags,
        }),
      });
      const result = await readCreatePostResponse(response);

      if (!response.ok || !result?.ok) {
        const message =
          result && "message" in result
            ? result.message
            : "코디 저장에 실패했습니다. 잠시 후 다시 시도해주세요.";

        setErrorMessage(message);
        return;
      }

      router.push("/feed");
      router.refresh();
    } catch {
      setErrorMessage("코디 저장 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmittingPost(false);
    }
  }

  const parsedTags = parseTagInput(tagsInput);
  const isBusy = isUploading || isSubmittingPost;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Badge tone={uploadedUrl ? "success" : "neutral"}>1단계</Badge>
          <h2 className="text-base font-bold text-slate-900">이미지 올리기</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-slate-600">
            지원 형식: PNG/JPEG/WEBP, 최대 {formatMegabytes(MAX_IMAGE_SIZE_BYTES)}
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-slate-700"
          />

          {selectedFile ? (
            <p className="text-xs text-slate-500">
              선택 파일: {selectedFile.name} ({formatMegabytes(selectedFile.size)})
            </p>
          ) : null}

          <Button
            type="button"
            disabled={isBusy}
            onClick={() => {
              void handleUpload();
            }}
            variant="secondary"
          >
            {isUploading ? "업로드 중..." : "이미지 업로드"}
          </Button>
        </CardBody>
      </Card>

      {uploadedUrl ? (
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Badge tone="success">2단계</Badge>
            <h2 className="text-base font-bold text-slate-900">코디 정보 입력</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedPreviewUrl ?? uploadedUrl}
                alt="업로드된 이미지 미리보기"
                className="h-auto max-h-96 w-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">이미지 URL</p>
              <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-3 py-2 text-xs text-slate-700 break-all">
                {uploadedUrl}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  void handleCopyUrl();
                }}
              >
                URL 복사
              </Button>
              {copyMessage ? <p className="text-xs text-slate-500">{copyMessage}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="post-caption" className="text-sm font-semibold text-slate-700">
                캡션
              </label>
              <textarea
                id="post-caption"
                rows={4}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="코디 포인트를 짧고 선명하게 적어줘"
                className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="post-tags" className="text-sm font-semibold text-slate-700">
                태그
              </label>
              <input
                id="post-tags"
                type="text"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="#미니멀 #스트릿 또는 미니멀, 스트릿"
                className="w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--brand)]"
              />
              <p className="text-xs text-slate-500">
                공백/쉼표 기준으로 최대 {MAX_POST_TAGS}개까지 저장됩니다.
              </p>
              {parsedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {parsedTags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void handleCreatePost();
                }}
              >
                {isSubmittingPost ? "저장 중..." : "코디 올리기"}
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="py-6 text-sm text-slate-600">
            이미지 업로드가 끝나면 2단계 입력 폼이 열립니다.
          </CardBody>
        </Card>
      )}

      {errorMessage ? (
        <ErrorState
          title="처리에 실패했어요."
          description={errorMessage}
        />
      ) : null}
    </div>
  );
}
