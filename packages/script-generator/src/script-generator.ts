import { TaskDefinition, Plan } from '@vibestart/shared-types';
import { TaskRegistry } from '@vibestart/task-catalog';
import { PolicyEngine } from '@vibestart/policy-engine';
import { VariableResolver, VariableMap } from './services/variable-resolver';
import { OnboardingInput, PlanBuilder } from './services/plan-builder';
import { toPowerShell } from './templates/powershell';
import { toBash } from './templates/bash';

export interface GeneratedStep {
  taskKey: string;
  displayName: string;
  description: string;
  script: string;
  order: number;
}

export interface GeneratedPlan {
  plan: Plan;
  steps: GeneratedStep[];
  os: 'windows' | 'macos';
}

/**
 * 온보딩 입력 + 변수를 받아 단계별 스크립트를 생성한다.
 * PolicyEngine 검증을 통과한 Task만 스크립트로 변환한다.
 */
export class ScriptGenerator {
  private registry: TaskRegistry;
  private planBuilder: PlanBuilder;
  private policyEngine: PolicyEngine | null;

  constructor(registry: TaskRegistry, policyEngine?: PolicyEngine) {
    this.registry = registry;
    this.planBuilder = new PlanBuilder(registry);
    this.policyEngine = policyEngine ?? null;
  }

  generate(input: OnboardingInput, variables: VariableMap): GeneratedPlan {
    const plan = this.planBuilder.build(input);
    const resolver = new VariableResolver(variables);
    const toScript = input.os === 'windows' ? toPowerShell : toBash;

    const steps: GeneratedStep[] = plan.steps.map((step) => {
      const task = this.registry.get(step.taskKey);
      if (!task) {
        throw new Error(`Task "${step.taskKey}" not found in registry.`);
      }

      if (this.policyEngine) {
        const result = this.policyEngine.validate(task, variables);
        if (!result.valid) {
          const messages = result.violations.map((v) => v.message).join('; ');
          throw new Error(`Policy violation for "${task.taskKey}": ${messages}`);
        }
      }

      return {
        taskKey: step.taskKey,
        displayName: task.displayName,
        description: task.description,
        script: toScript(task, resolver),
        order: step.order,
      };
    });

    return { plan, steps, os: input.os };
  }
}
