/**
 * 발행 페이지 claim — "가입하고 영구 보관".
 *
 * 흐름: 익명 발행 성공 시 클라이언트가 `vs_pending_claim=slug` 쿠키를 심는다 →
 * 사용자가 가입/로그인(/auth/callback) → 여기서 그 slug를 현재 사용자로 claim
 * (owner 지정·expires 해제)하고 쿠키를 지운다.
 */

import "server-only";

import { cookies } from "next/headers";

import { claimPublishedPage } from "./published-page-store";

/** 클라이언트(build-wizard)와 동일 문자열로 유지할 것. */
export const PENDING_CLAIM_COOKIE = "vs_pending_claim";

/** 로그인 직후 호출. pending slug가 있으면 userId로 claim하고 쿠키 제거. */
export async function claimPendingPublishForUser(userId: string): Promise<void> {
  const store = await cookies();
  const slug = store.get(PENDING_CLAIM_COOKIE)?.value;
  if (!slug) return;
  store.delete(PENDING_CLAIM_COOKIE);
  try {
    await claimPublishedPage(slug, userId);
  } catch {
    // 만료·타인 소유 등 실패는 조용히 무시 — 로그인 흐름을 막지 않는다.
  }
}
