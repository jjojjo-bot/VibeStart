import type { DiagnosisRule, RemedyScript } from '@vibestart/shared-types';
import { DANGEROUS_PATTERNS } from '@vibestart/policy-engine';

export interface CatalogIssue {
  problem: string;
  ruleId?: string;
  remedyKey?: string;
}

/**
 * 진단 카탈로그 무결성·안전성 검증(빌드/로드 타임).
 *
 * 1. 규칙 id 유일성
 * 2. script 복구는 레지스트리에 존재해야 함
 * 3. ask 분기는 실제 규칙 id를 가리켜야 함
 * 4. 모든 복구 스크립트는 policy-engine의 DANGEROUS_PATTERNS를 통과해야 함
 *    (= 허용목록 단일 기준 재사용; 붙여넣은 텍스트로 명령을 만들지 않음을 보장)
 *
 * 빈 배열을 반환하면 카탈로그가 안전하다는 뜻이다.
 */
export function validateDiagnosisCatalog(
  rules: DiagnosisRule[],
  remedies: ReadonlyMap<string, RemedyScript>,
): CatalogIssue[] {
  const issues: CatalogIssue[] = [];

  const ruleIds = new Set<string>();
  for (const rule of rules) {
    if (ruleIds.has(rule.id)) {
      issues.push({ ruleId: rule.id, problem: '중복된 규칙 id' });
    }
    ruleIds.add(rule.id);
  }

  for (const rule of rules) {
    const remedy = rule.remedy;
    if (remedy.kind === 'script') {
      if (!remedies.has(remedy.remedyKey)) {
        issues.push({
          ruleId: rule.id,
          problem: `복구 스크립트 없음: ${remedy.remedyKey}`,
        });
      }
    } else if (remedy.kind === 'ask') {
      for (const branchId of remedy.branchRuleIds) {
        if (!ruleIds.has(branchId)) {
          issues.push({ ruleId: rule.id, problem: `분기 규칙 없음: ${branchId}` });
        }
      }
    }
  }

  for (const script of remedies.values()) {
    for (const action of script.actions) {
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(action.command)) {
          issues.push({
            remedyKey: script.remedyKey,
            problem: `위험한 셸 패턴: ${action.command}`,
          });
          break;
        }
      }
    }
  }

  return issues;
}
