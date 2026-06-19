import type { TemplateDefinition, TemplateFieldKey, TemplateValues } from '@vibestart/shared-types';

/**
 * 템플릿 값 정제 — 신뢰 불가한 입력(공개 publish API 등)을 스키마로 거른다.
 *
 * - 객체가 아니면 null.
 * - 템플릿이 허용한 칸(tpl.fields)만 통과, 그 밖의 키는 버린다.
 * - 비문자열 값은 버린다(전체 거부 아님 — publish는 가능한 만큼 살린다).
 * - 칸당 길이를 상한으로 자른다(렌더는 이스케이프하지만 폭주 방지).
 * - 통과 칸이 하나도 없으면 null.
 *
 * XSS 이스케이프는 renderTemplate가 담당한다. 이 함수는 구조·크기만 본다.
 */

export const MAX_FIELD_LEN = 5000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function sanitizeTemplateValues(
  tpl: TemplateDefinition,
  candidate: unknown,
): TemplateValues | null {
  if (!isPlainObject(candidate)) return null;

  const allowed = new Set<TemplateFieldKey>(tpl.fields);
  const result: TemplateValues = {};
  let count = 0;

  for (const key of tpl.fields) {
    const value = candidate[key];
    if (!allowed.has(key)) continue;
    if (typeof value !== 'string') continue;
    result[key] = value.slice(0, MAX_FIELD_LEN);
    count += 1;
  }

  return count > 0 ? result : null;
}
