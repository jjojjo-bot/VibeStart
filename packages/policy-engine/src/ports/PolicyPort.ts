import { TaskDefinition } from '@vibestart/shared-types';
import { VariableMap } from './types';

export interface PolicyViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export type PolicyResult =
  | { valid: true }
  | { valid: false; violations: PolicyViolation[] };

/**
 * 스크립트 생성 전 안전성을 검증하는 포트.
 * 모든 검증 어댑터는 이 인터페이스를 구현한다.
 */
export interface PolicyPort {
  validate(task: TaskDefinition, variables: VariableMap): PolicyResult;
}
