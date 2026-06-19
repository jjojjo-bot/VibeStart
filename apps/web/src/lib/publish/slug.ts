import type { SlugRejection } from "@vibestart/shared-types";

/**
 * 발행 슬러그(/p/{slug}) 규칙 — 순수·결정론.
 *
 * - 소문자 영숫자 + 하이픈, 양끝은 영숫자.
 * - 3~32자.
 * - 예약어(라우트·브랜드) 금지 — 사이트 경로와 충돌·사칭 방지.
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 32;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** 라우트·브랜드 예약어. 추가 시 소문자로. */
const RESERVED = new Set<string>([
  "p",
  "api",
  "auth",
  "admin",
  "www",
  "app",
  "start",
  "about",
  "blog",
  "login",
  "logout",
  "signup",
  "dashboard",
  "onboarding",
  "setup",
  "plan",
  "projects",
  "project",
  "privacy",
  "terms",
  "complete",
  "og",
  "track",
  "sitemap",
  "robots",
  "ads",
  "new",
  "me",
  "settings",
  "vibestart",
  "vibe",
  "support",
  "help",
  "status",
]);

/** 자유 입력(제목 등)을 슬러그 후보로 정규화한다(검증과 별개). */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function validateSlug(slug: string): { ok: true } | { ok: false; reason: SlugRejection } {
  if (slug.length < SLUG_MIN) return { ok: false, reason: "too-short" };
  if (slug.length > SLUG_MAX) return { ok: false, reason: "too-long" };
  if (!SLUG_RE.test(slug)) return { ok: false, reason: "invalid-chars" };
  if (RESERVED.has(slug)) return { ok: false, reason: "reserved" };
  return { ok: true };
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug);
}
