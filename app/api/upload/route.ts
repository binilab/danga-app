import { NextResponse } from "next/server";
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
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "업로드 중 알 수 없는 오류가 발생했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
