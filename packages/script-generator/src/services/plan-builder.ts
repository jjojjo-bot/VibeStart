import { Plan, PlanStatus, PlanStep, TaskStatus } from '@vibestart/shared-types';
import { TaskRegistry } from '@vibestart/task-catalog';

export type UserGoal = 'nextjs';

export interface OnboardingInput {
  os: 'windows' | 'macos';
  goal: UserGoal;
  projectName: string;
}

/**
 * 온보딩 입력을 기반으로 실행 플랜을 생성한다.
 * 설치(install) → 프로젝트(project) 순서로 단계를 구성한다.
 */
export class PlanBuilder {
  constructor(private registry: TaskRegistry) {}

  build(input: OnboardingInput): Plan {
    const steps: PlanStep[] = [];
    let order = 0;

    for (const task of this.registry.byCategory('install')) {
      steps.push(this.createStep(task.taskKey, order++));
    }

    for (const task of this.registry.byCategory('project')) {
      steps.push(this.createStep(task.taskKey, order++));
    }

    return {
      id: crypto.randomUUID(),
      status: PlanStatus.CREATED,
      steps,
      createdAt: new Date().toISOString(),
    };
  }

  private createStep(taskKey: string, order: number): PlanStep {
    return {
      taskKey,
      status: TaskStatus.PENDING,
      order,
    };
  }
}
