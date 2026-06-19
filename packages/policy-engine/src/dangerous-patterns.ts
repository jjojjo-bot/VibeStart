/**
 * 셸 인젝션에 사용될 수 있는 위험 패턴.
 *
 * allowlist 검증의 공용 출처. AllowlistAdapter(Phase 1 task)와
 * diagnosis-catalog(복구 스크립트) 양쪽이 동일 기준으로 검증하도록
 * 단일 진실 공급원으로 분리한다.
 */
export const DANGEROUS_PATTERNS: RegExp[] = [
  /;\s*rm\s/,
  /&&\s*rm\s/,
  /\|\s*rm\s/,
  /`[^`]*`/,
  /\$\([^)]*\)/,
  />\s*\/etc\//,
  />\s*\/usr\//,
  />\s*\/bin\//,
  /\brm\s+-rf?\s+\//,
  /\bsudo\s/,
  /\bcurl\b.*\|\s*\bbash\b/,
  /\bwget\b.*\|\s*\bbash\b/,
];
