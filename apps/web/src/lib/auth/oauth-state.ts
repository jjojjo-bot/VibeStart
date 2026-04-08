/**
 * OAuth state 서명 유틸.
 *
 * OAuth2 authorize → callback 플로우에서 CSRF 방지와 컨텍스트 전달을 위해
 * 서명된 JSON payload를 HttpOnly 쿠키에 저장한다. callback이 원래 요청과
 * 같은 브라우저/사용자에서 왔는지, 그리고 어떤 프로젝트/마일스톤/서브스텝
 * 으로 복귀해야 하는지를 검증한다.
 *
 * 형식: base64url(JSON).base64url(HMAC-SHA256).
 * 의존성: Node crypto만 사용 (라이브러리 추가 없음).
 */

import "server-only";

import crypto from "node:crypto";

export interface OAuthStatePayload {
  /** CSRF 방지용 random state (URL 파라미터와도 대조) */
  state: string;
  userId: string;
  projectId: string;
  milestoneId: string;
  substepId: string;
  /** 성공/실패 시 사용자를 돌려보낼 상대 경로 (locale prefix 포함) */
  returnTo: string;
  /** Unix ms. 이 시간 이후엔 유효하지 않음. */
  expiresAt: number;
}

const COOKIE_NAME = "vibestart_oauth_state";
const TTL_MS = 10 * 60 * 1000; // 10분

function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "OAUTH_STATE_SECRET 환경변수가 설정되지 않았거나 너무 짧습니다. " +
        "32자 이상 랜덤 문자열을 apps/web/.env.local에 추가해주세요. " +
        "생성 예: openssl rand -hex 32",
    );
  }
  return secret;
}

function b64urlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function b64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf-8");
}

export function generateRandomState(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function buildPayload(
  input: Omit<OAuthStatePayload, "state" | "expiresAt">,
): OAuthStatePayload {
  return {
    ...input,
    state: generateRandomState(),
    expiresAt: Date.now() + TTL_MS,
  };
}

export function signOAuthState(payload: OAuthStatePayload): string {
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(token: string): OAuthStatePayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, sig] = parts as [string, string];
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(body)
      .digest("base64url");
    // 타이밍 공격 방어
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const payload = JSON.parse(b64urlDecode(body)) as OAuthStatePayload;
    if (typeof payload.expiresAt !== "number") return null;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const OAUTH_STATE_COOKIE = COOKIE_NAME;
export const OAUTH_STATE_TTL_SECONDS = TTL_MS / 1000;
