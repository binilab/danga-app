import "server-only";

import { decrypt, encrypt } from "@/lib/crypto/aesgcm";

type EncryptProfileSensitiveInput = {
  email: string | null;
  name: string | null;
};

type DecryptProfileSensitiveInput = {
  emailEnc: string | null;
  nameEnc: string | null;
};

/**
 * profiles의 민감 정보(email/name)를 암호화 컬럼 값으로 변환합니다.
 */
export function encryptProfileSensitiveFields({
  email,
  name,
}: EncryptProfileSensitiveInput) {
  return {
    emailEnc: email ? encrypt(email) : null,
    nameEnc: name ? encrypt(name) : null,
  };
}

/**
 * profiles의 암호화 컬럼(email_enc/name_enc)을 복호화해 평문으로 반환합니다.
 */
export function decryptProfileSensitiveFields({
  emailEnc,
  nameEnc,
}: DecryptProfileSensitiveInput) {
  return {
    email: emailEnc ? decrypt(emailEnc) : null,
    name: nameEnc ? decrypt(nameEnc) : null,
  };
}
