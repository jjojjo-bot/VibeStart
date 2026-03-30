import { TaskDefinition } from '@vibestart/shared-types';
import { TaskRegistry } from '@vibestart/task-catalog';
import { PolicyPort, PolicyResult, PolicyViolation } from '../ports/PolicyPort';
import { VariableMap } from '../ports/types';

/** 셸 인젝션에 사용될 수 있는 위험 패턴 */
const DANGEROUS_PATTERNS = [
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

/**
 * Task Catalog에 등록된 명령만 허용하는 allowlist 검증 어댑터.
 *
 * 검증 규칙:
 * 1. task가 레지스트리에 등록되어 있는지 확인
 * 2. 각 action command에 위험한 셸 패턴이 없는지 확인
 */
export class AllowlistAdapter implements PolicyPort {
  constructor(private registry: TaskRegistry) {}

  validate(task: TaskDefinition, _variables: VariableMap): PolicyResult {
    const violations: PolicyViolation[] = [];

    if (!this.registry.has(task.taskKey)) {
      violations.push({
        rule: 'allowlist/registered-task',
        message: `Task "${task.taskKey}"는 Task Catalog에 등록되지 않았습니다.`,
        severity: 'error',
      });
    }

    for (const action of task.actions) {
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(action.command)) {
          violations.push({
            rule: 'allowlist/dangerous-pattern',
            message: `Task "${task.taskKey}"의 명령에 위험한 패턴이 감지되었습니다: ${action.command}`,
            severity: 'error',
          });
          break;
        }
      }
    }

    return violations.length === 0
      ? { valid: true }
      : { valid: false, violations };
  }
}
