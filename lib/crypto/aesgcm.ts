import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ALGORITHM = "aes-256-gcm";

let cachedKey: Buffer | null = null;

/**
 * APP_ENCRYPTION_KEY(base64)를 읽어 32바이트 AES 키로 변환하고 검증합니다.
 */
function getEncryptionKey() {
  if (cachedKey) {
    return cachedKey;
  }

  const raw = process.env.APP_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY가 비어 있습니다. base64 인코딩된 32바이트 키를 설정해주세요.",
    );
  }

  let decoded: Buffer;

  try {
    decoded = Buffer.from(raw, "base64");
  } catch {
    throw new Error("APP_ENCRYPTION_KEY를 base64로 해석하지 못했습니다.");
  }

  if (decoded.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY 길이가 올바르지 않습니다. 현재 ${decoded.length}바이트이며 32바이트여야 합니다.`,
    );
  }

  cachedKey = decoded;
  return cachedKey;
}

/**
 * iv(12) + tag(16) + cipher 바이트를 하나로 합쳐 base64 문자열로 인코딩합니다.
 */
function packEncrypted(iv: Buffer, tag: Buffer, cipher: Buffer) {
  return Buffer.concat([iv, tag, cipher]).toString("base64");
}

/**
 * 단일 base64 암호문을 iv/tag/cipher로 분해합니다.
 */
function unpackEncrypted(payload: string) {
  const merged = Buffer.from(payload, "base64");

  if (merged.length <= IV_LENGTH + TAG_LENGTH) {
    throw new Error("암호문 포맷이 올바르지 않습니다.");
  }

  const iv = merged.subarray(0, IV_LENGTH);
  const tag = merged.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const cipher = merged.subarray(IV_LENGTH + TAG_LENGTH);

  return { iv, tag, cipher };
}

/**
 * 평문 문자열을 AES-256-GCM으로 암호화해 단일 base64 문자열로 반환합니다.
 */
export function encrypt(plaintext: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return packEncrypted(iv, tag, encrypted);
}

/**
 * 단일 base64 암호문을 AES-256-GCM으로 복호화해 평문 문자열로 반환합니다.
 */
export function decrypt(ciphertext: string) {
  const key = getEncryptionKey();
  const { iv, tag, cipher } = unpackEncrypted(ciphertext);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(cipher), decipher.final()]);

  return decrypted.toString("utf8");
}
