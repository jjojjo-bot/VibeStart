import type {
  DiagnosisHit,
  DiagnosisOutcome,
  DiagnosisRule,
  DiagnosisStep,
  ParsedMarker,
} from '@vibestart/shared-types';

const MARKER_RE = /VIBESTART::([^\n\r]+)/g;

/** 붙여넣은 출력에서 우리 구조화 마커를 파싱한다(신뢰 가능). */
export function parseMarkers(output: string): ParsedMarker[] {
  const markers: ParsedMarker[] = [];
  for (const match of output.matchAll(MARKER_RE)) {
    const body = match[1];
    if (!body) continue;
    const parsed: ParsedMarker = {};
    for (const pair of body.split('::')) {
      const eq = pair.indexOf('=');
      if (eq < 0) continue;
      const key = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (!value) continue;
      if (key === 'step') parsed.step = value;
      else if (key === 'result' && (value === 'ok' || value === 'fail')) parsed.result = value;
      else if (key === 'code') parsed.code = value;
    }
    markers.push(parsed);
  }
  return markers;
}

export interface DiagnoseInput {
  /** 사용자가 붙여넣은 터미널 출력(신뢰 불가 — 매칭 전용). */
  output: string;
  /** 현재 단계(있으면 단계별 규칙으로 좁힌다). */
  step?: DiagnosisStep;
}

/**
 * 시드 규칙에 비춰 붙여넣은 출력을 진단한다.
 * 마커 매칭(고신뢰)을 시그니처보다 우선한다.
 * 매칭에만 사용하며, 복구 명령을 출력에서 합성하지 않는다.
 */
export class DiagnosisMatcher {
  constructor(private readonly rules: DiagnosisRule[]) {}

  diagnose(input: DiagnoseInput): DiagnosisOutcome {
    const codes = parseMarkers(input.output)
      .map((m) => m.code)
      .filter((c): c is string => typeof c === 'string');

    const hits: DiagnosisHit[] = [];
    for (const rule of this.rules) {
      if (rule.match.steps && input.step && !rule.match.steps.includes(input.step)) {
        continue;
      }
      if (rule.match.markerCodes?.some((c) => codes.includes(c))) {
        hits.push({ rule, matchedOn: 'marker' });
        continue;
      }
      if (rule.match.signatures?.some((s) => new RegExp(s, 'i').test(input.output))) {
        hits.push({ rule, matchedOn: 'signature' });
      }
    }

    const markerHits = hits.filter((h) => h.matchedOn === 'marker');
    const [firstMarker] = markerHits;
    if (markerHits.length === 1 && firstMarker) {
      return { kind: 'recognized', hit: firstMarker };
    }
    if (markerHits.length > 1) {
      return { kind: 'ambiguous', hits: markerHits };
    }

    const [firstHit] = hits;
    if (hits.length === 0 || !firstHit) {
      return { kind: 'unknown' };
    }
    if (hits.length === 1 && firstHit.rule.confidence === 'high') {
      return { kind: 'recognized', hit: firstHit };
    }
    return { kind: 'ambiguous', hits };
  }
}
