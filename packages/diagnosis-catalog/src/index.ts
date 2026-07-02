import type { RemedyScript } from '@vibestart/shared-types';
import { DiagnosisMatcher } from './matcher';
import { diagnosisRules } from './rules';
import { remedyScripts } from './remedies';

export { DiagnosisMatcher, parseMarkers } from './matcher';
export type { DiagnoseInput } from './matcher';
export { maskSensitive } from './mask';
export { parseScanOutput } from './scan';
export { validateDiagnosisCatalog } from './validate-catalog';
export type { CatalogIssue } from './validate-catalog';
export { diagnosisRules } from './rules';
export { remedyScripts } from './remedies';

/** remedyKey → 복구 스크립트 조회용 레지스트리. */
export const remedyRegistry: ReadonlyMap<string, RemedyScript> = new Map(
  remedyScripts.map((r) => [r.remedyKey, r]),
);

export function getRemedy(remedyKey: string): RemedyScript | undefined {
  return remedyRegistry.get(remedyKey);
}

/** 시드 규칙으로 구성한 기본 매처. */
export const defaultDiagnosisMatcher = new DiagnosisMatcher(diagnosisRules);
