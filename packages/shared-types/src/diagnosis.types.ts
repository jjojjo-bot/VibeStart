import type { TaskAction } from './task.types';

/**
 * D′ — 무실패 로컬 셋업 "진단 루프"의 데이터 형태.
 *
 * 사용자가 막혔을 때 터미널 출력을 붙여넣으면, 매처가 이 규칙들에 비춰
 * 원인을 진단하고 '사전 작성된' 복구만 제시한다. 붙여넣은 출력은 신뢰 불가
 * 입력이며, 오직 매칭에만 쓰고 복구 명령 합성에는 절대 쓰지 않는다.
 */

/** D′ 로컬 셋업의 각 단계 식별자. */
export type DiagnosisStep =
  | 'preflight'
  | 'wsl-install'
  | 'tools-install'
  | 'claude-install'
  | 'clone-project'
  | 'claude-login';

export type DiagnosisConfidence = 'high' | 'medium';

/** 붙여넣은 출력에서 무엇을 보고 규칙을 매칭할지. */
export interface DiagnosisMatch {
  /** 우리 스크립트가 심은 마커 code(고신뢰). 예: '0x80370102'. */
  markerCodes?: string[];
  /** 하위 도구가 뱉는 알려진 에러 문자열(정규식 소스, 대소문자 무시). */
  signatures?: string[];
  /** 이 규칙이 적용되는 단계. 없으면 전 단계 공통. */
  steps?: DiagnosisStep[];
}

/**
 * 복구 방법. 어느 경우든 '사전 작성된' 것만 가리킨다.
 * 붙여넣은 텍스트로 명령을 합성하지 않는다(allowlist).
 */
/** 그림 가이드 참고 이미지(텍스트만으론 부족한 BIOS 등). alt는 i18n 키. */
export interface GuideImage {
  src: string;
  altKey: string;
}

export type DiagnosisRemedy =
  | { kind: 'script'; remedyKey: string }
  | { kind: 'guide'; guideKey: string; image?: GuideImage }
  | { kind: 'reboot' }
  | { kind: 'newShell' }
  | { kind: 'ask'; questionKey: string; branchRuleIds: string[] };

export interface DiagnosisRule {
  id: string;
  match: DiagnosisMatch;
  confidence: DiagnosisConfidence;
  /** 일상어 원인 설명의 i18n 키. */
  causeKey: string;
  remedy: DiagnosisRemedy;
  /** 고친 뒤 재검증할 단계. */
  verifyStep: DiagnosisStep;
}

/**
 * 사전 작성·허용목록 검증된 복구 스크립트.
 * actions는 Phase 1 TaskAction과 동일 형태를 재사용한다.
 */
export interface RemedyScript {
  remedyKey: string;
  displayName: string;
  description: string;
  requiresElevation: boolean;
  actions: TaskAction[];
}

export interface DiagnosisHit {
  rule: DiagnosisRule;
  matchedOn: 'marker' | 'signature';
}

export type DiagnosisOutcome =
  | { kind: 'recognized'; hit: DiagnosisHit }
  | { kind: 'ambiguous'; hits: DiagnosisHit[] }
  | { kind: 'unknown' };

/** 붙여넣은 출력에서 파싱한 우리 마커 한 건. */
export interface ParsedMarker {
  step?: string;
  result?: 'ok' | 'fail';
  code?: string;
}

/** 환경 스캔("내 컴퓨터 확인하기") 판정 결과. true = 이미 설치됨. */
export interface ScanResult {
  wsl: boolean;
  vscode: boolean;
}
