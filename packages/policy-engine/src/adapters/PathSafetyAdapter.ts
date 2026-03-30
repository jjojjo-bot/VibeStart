import { TaskDefinition } from '@vibestart/shared-types';
import { PolicyPort, PolicyResult, PolicyViolation } from '../ports/PolicyPort';
import { VariableMap } from '../ports/types';

/** 경로 값에서 차단할 위험 패턴 */
const UNSAFE_PATH_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /~\/\.\./,
  /\0/,
];

/** 명령어 내에서 차단할 위험 경로 접근 패턴 */
const SENSITIVE_PATH_PATTERNS = [
  /\/etc\/(passwd|shadow|sudoers)/,
  /\/usr\/(bin|sbin)\//,
  /\/var\/log\//,
  /C:\\Windows\\System32/i,
  /HKLM:\\/i,
];

/**
 * 변수에 포함된 경로의 안전성을 검증하는 어댑터.
 *
 * 검증 규칙:
 * 1. 변수 값에 path traversal 패턴(../)이 없는지 확인
 * 2. 명령어에 민감한 시스템 경로 접근이 없는지 확인
 */
export class PathSafetyAdapter implements PolicyPort {
  validate(task: TaskDefinition, variables: VariableMap): PolicyResult {
    const violations: PolicyViolation[] = [];

    for (const [key, value] of Object.entries(variables)) {
      for (const pattern of UNSAFE_PATH_PATTERNS) {
        if (pattern.test(value)) {
          violations.push({
            rule: 'path-safety/traversal',
            message: `변수 "${key}"에 경로 탐색(traversal) 패턴이 감지되었습니다: ${value}`,
            severity: 'error',
          });
          break;
        }
      }
    }

    for (const action of task.actions) {
      for (const pattern of SENSITIVE_PATH_PATTERNS) {
        if (pattern.test(action.command)) {
          violations.push({
            rule: 'path-safety/sensitive-path',
            message: `Task "${task.taskKey}"의 명령에 민감한 시스템 경로 접근이 감지되었습니다: ${action.command}`,
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
