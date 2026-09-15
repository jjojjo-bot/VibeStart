import "server-only";

import crypto from "node:crypto";

const TOKEN_PREFIX = "enc:v1";

function encryptionKey(): Buffer {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "OAUTH_STATE_SECRET 환경변수가 설정되지 않았거나 너무 짧습니다.",
    );
  }

  // OAuth state 서명 키와 같은 원본을 쓰되 용도 문자열로 키를 분리한다.
  return crypto
    .createHash("sha256")
    .update(`vibestart/oauth-token/v1\0${secret}`)
    .digest();
}

export function encryptOAuthToken(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptOAuthToken(value: string): string {
  if (!value.startsWith(`${TOKEN_PREFIX}:`)) {
    // 배포 전 저장된 평문 토큰은 연결을 다시 할 때 암호문으로 교체된다.
    return value;
  }

  const parts = value.split(":");
  if (parts.length !== 5) {
    throw new Error("저장된 OAuth 토큰 형식이 올바르지 않습니다.");
  }

  const [, , ivRaw, authTagRaw, encryptedRaw] = parts;
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivRaw!, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTagRaw!, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw!, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("저장된 OAuth 토큰을 복호화할 수 없습니다.");
  }
}
