/**
 * B′ 화면 4 — 퍼블리시. 미리보기한 페이지를 라이브 URL(vibe-start.com/p/slug)로.
 *
 * 흐름: 익명 임시 발행(TTL) → 라이브 URL → 가입하면 영구 보관(claim).
 * 저장 구조는 결정론적 렌더(template.types)에 필요한 최소값만 담는다 —
 * templateId + 사용자 값. 렌더 시 모든 값은 이스케이프된다(XSS-safe).
 */

import type { TemplateValues } from './template.types';

export interface PublishedPage {
  /** URL 슬러그(/p/{slug}). 소문자 영숫자+하이픈, 전역 유일. */
  slug: string;
  templateId: string;
  values: TemplateValues;
  /** 소유자(가입 사용자). null = 익명/미클레임(TTL 만료 대상). */
  ownerId: string | null;
  createdAt: string;
  /** 만료 시각(ISO). null = 영구(클레임됨). 익명은 createdAt + TTL. */
  expiresAt: string | null;
}

export interface PublishPageInput {
  slug: string;
  templateId: string;
  values: TemplateValues;
}

/** 슬러그 거부 사유 — UI 친화 메시지로 매핑한다. */
export type SlugRejection = 'too-short' | 'too-long' | 'invalid-chars' | 'reserved';

export type PublishFailure = 'invalid-slug' | 'slug-taken' | 'invalid-template' | 'rate-limited';

export type PublishResult =
  | { ok: true; slug: string; path: string; expiresAt: string | null }
  | { ok: false; reason: PublishFailure };
