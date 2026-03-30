export { PolicyEngine } from './policy-engine';

export type { PolicyPort, PolicyResult, PolicyViolation } from './ports/PolicyPort';
export type { VariableMap } from './ports/types';

export { AllowlistAdapter } from './adapters/AllowlistAdapter';
export { PathSafetyAdapter } from './adapters/PathSafetyAdapter';

import { TaskRegistry } from '@vibestart/task-catalog';
import { PolicyEngine } from './policy-engine';
import { AllowlistAdapter } from './adapters/AllowlistAdapter';
import { PathSafetyAdapter } from './adapters/PathSafetyAdapter';

/**
 * 기본 PolicyEngine 인스턴스를 생성한다.
 * AllowlistAdapter + PathSafetyAdapter를 조합.
 */
export function createDefaultPolicyEngine(registry: TaskRegistry): PolicyEngine {
  return new PolicyEngine([
    new AllowlistAdapter(registry),
    new PathSafetyAdapter(),
  ]);
}
