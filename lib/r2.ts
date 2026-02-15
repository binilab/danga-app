import { randomBytes } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type UploadImageInput = {
  body: Buffer;
  contentType: AllowedImageMimeType;
  originalFileName: string;
  userId: string;
};

type UploadImageResult = {
  key: string;
  url: string;
  signedUrl: string;
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const MIME_EXTENSION_MAP: Record<AllowedImageMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

let cachedClient: S3Client | null = null;

/**
 * R2 연결에 필요한 환경 변수를 읽고 누락 여부를 검사합니다.
 */
function getR2Env() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "R2 환경 변수가 비어 있습니다. R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME를 확인해주세요.",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl: publicBaseUrl ? publicBaseUrl.replace(/\/$/, "") : null,
  };
}

/**
 * 서버에서만 재사용하는 R2(S3 호환) 클라이언트를 싱글턴으로 생성합니다.
 */
function getR2Client() {
  if (cachedClient) {
    return cachedClient;
  }

  const { accountId, accessKeyId, secretAccessKey } = getR2Env();

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedClient;
}

/**
 * 파일명에서 확장자를 뽑아 안전한 문자만 남깁니다.
 */
function sanitizeFileExtension(fileName: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);

  if (!match) {
    return "";
  }

  return match[1].toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * content-type과 파일명을 바탕으로 최종 확장자를 결정합니다.
 */
function resolveExtension(contentType: AllowedImageMimeType, originalFileName: string) {
  const fromName = sanitizeFileExtension(originalFileName);

  if (fromName) {
    if (contentType === "image/jpeg" && ["jpg", "jpeg"].includes(fromName)) {
      return "jpg";
    }

    if (contentType === "image/png" && fromName === "png") {
      return "png";
    }

    if (contentType === "image/webp" && fromName === "webp") {
      return "webp";
    }
  }

  return MIME_EXTENSION_MAP[contentType];
}

/**
 * object key에 들어갈 userId를 경로 안전 문자열로 정리합니다.
 */
function sanitizeUserId(userId: string) {
  const trimmed = userId.trim().toLowerCase();
  const sanitized = trimmed.replace(/[^a-z0-9_-]/g, "");

  return sanitized || "anon";
}

/**
 * 요구한 규칙(posts/{userId}/{timestamp}-{random}.{ext})에 맞는 R2 key를 생성합니다.
 */
function createPostImageKey(userId: string, extension: string) {
  const safeUserId = sanitizeUserId(userId);
  const timestamp = Date.now();
  const random = randomBytes(6).toString("hex");

  return `posts/${safeUserId}/${timestamp}-${random}.${extension}`;
}

/**
 * 커스텀 도메인이 없을 때도 확인 가능한 임시 서명 URL(GET, 1시간)을 생성합니다.
 */
async function createSignedObjectUrl(key: string) {
  const env = getR2Env();
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: env.bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 60 * 60 });
}

/**
 * R2 object key로 GET 서명 URL을 생성합니다. 피드/상세 미리보기에 사용합니다.
 */
export async function createSignedReadUrlByKey(key: string) {
  return createSignedObjectUrl(key);
}

/**
 * 이미지 파일을 R2 버킷에 업로드하고 공개 URL을 반환합니다.
 */
export async function uploadImageToR2({
  body,
  contentType,
  originalFileName,
  userId,
}: UploadImageInput): Promise<UploadImageResult> {
  const env = getR2Env();
  const client = getR2Client();
  const ext = resolveExtension(contentType, originalFileName);
  const key = createPostImageKey(userId, ext);

  const command = new PutObjectCommand({
    Bucket: env.bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);
  const signedUrl = await createSignedObjectUrl(key);

  return {
    key,
    url: env.publicBaseUrl ? `${env.publicBaseUrl}/${key}` : signedUrl,
    signedUrl,
  };
}
