import { TaskDefinition } from '@vibestart/shared-types';
import { PolicyPort, PolicyResult, PolicyViolation } from './ports/PolicyPort';
import { VariableMap } from './ports/types';

/**
 * 여러 PolicyPort 구현체를 조합하여 종합 검증을 수행한다.
 * 모든 어댑터의 결과를 합산하여 하나의 PolicyResult를 반환한다.
 */
export class PolicyEngine {
  private policies: PolicyPort[];

  constructor(policies: PolicyPort[]) {
    this.policies = policies;
  }

  validate(task: TaskDefinition, variables: VariableMap): PolicyResult {
    const allViolations: PolicyViolation[] = [];

    for (const policy of this.policies) {
      const result = policy.validate(task, variables);
      if (!result.valid) {
        allViolations.push(...result.violations);
      }
    }

    return allViolations.length === 0
      ? { valid: true }
      : { valid: false, violations: allViolations };
  }

  validateAll(tasks: TaskDefinition[], variables: VariableMap): PolicyResult {
    const allViolations: PolicyViolation[] = [];

    for (const task of tasks) {
      const result = this.validate(task, variables);
      if (!result.valid) {
        allViolations.push(...result.violations);
      }
    }

    return allViolations.length === 0
      ? { valid: true }
      : { valid: false, violations: allViolations };
  }
}
