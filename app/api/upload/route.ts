import { NextResponse } from "next/server";
import { logDevError } from "@/lib/log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  type AllowedImageMimeType,
  uploadImageToR2,
} from "@/lib/r2";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const runtime = "nodejs";

/**
 * 전달받은 MIME 타입이 업로드 허용 목록인지 검사합니다.
 */
function isAllowedImageType(type: string): type is AllowedImageMimeType {
  return ALLOWED_IMAGE_MIME_TYPES.includes(type as AllowedImageMimeType);
}

/**
 * form-data에서 file 필드를 꺼내고 파일 형식을 검증합니다.
 */
function getFileFromFormData(formData: FormData) {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return { error: "이미지 파일이 필요합니다. file 필드를 확인해주세요.", status: 400 };
  }

  return { file };
}

type UploadApiErrorInfo = {
  status: number;
  message: string;
};

/**
 * R2/AWS SDK 오류 객체를 사용자 메시지와 HTTP 상태코드로 변환합니다.
 */
function toUploadApiError(error: unknown): UploadApiErrorInfo {
  if (!(error instanceof Error)) {
    return {
      status: 500,
      message: "업로드 중 알 수 없는 오류가 발생했습니다.",
    };
  }

  const maybeAwsError = error as Error & {
    code?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };

  const code = maybeAwsError.Code ?? maybeAwsError.code ?? error.name;
  const statusFromMetadata = maybeAwsError.$metadata?.httpStatusCode;

  if (
    code === "AccessDenied" ||
    code === "InvalidAccessKeyId" ||
    code === "SignatureDoesNotMatch" ||
    statusFromMetadata === 403
  ) {
    return {
      status: 403,
      message:
        "R2 접근 권한이 없습니다. R2 API 토큰 권한(Object Read/Write)과 Account/Bucket 설정을 확인해주세요.",
    };
  }

  if (code === "NoSuchBucket") {
    return {
      status: 500,
      message: "R2 버킷을 찾을 수 없습니다. R2_BUCKET_NAME 값을 확인해주세요.",
    };
  }

  if (error.message.includes("R2 환경 변수가 비어 있습니다")) {
    return {
      status: 500,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: `업로드 처리 중 서버 오류가 발생했습니다. (${code})`,
  };
}

/**
 * 업로드 API: 이미지 파일을 받아 R2에 저장하고 공개 URL을 반환합니다.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileResult = getFileFromFormData(formData);

    if ("error" in fileResult) {
      return NextResponse.json(
        { ok: false, message: fileResult.error },
        { status: fileResult.status },
      );
    }

    const file = fileResult.file;

    if (!isAllowedImageType(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          message: "지원하지 않는 이미지 형식입니다. PNG, JPEG, WEBP만 업로드할 수 있습니다.",
        },
        { status: 415 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, message: "이미지 용량은 5MB 이하만 업로드할 수 있습니다." },
        { status: 413 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? "anon";
    const uploaded = await uploadImageToR2({
      body,
      contentType: file.type,
      originalFileName: file.name,
      userId,
    });

    return NextResponse.json({
      ok: true,
      key: uploaded.key,
      url: uploaded.url,
      signedUrl: uploaded.signedUrl,
    });
  } catch (error) {
    const mapped = toUploadApiError(error);
    logDevError("[upload] failed", {
      status: mapped.status,
      message: mapped.message,
      raw: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ok: false,
        message: mapped.message,
      },
      { status: mapped.status },
    );
  }
}
