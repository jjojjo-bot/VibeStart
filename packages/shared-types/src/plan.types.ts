import { TaskKey, TaskStatus } from './task.types';

export enum PlanStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface PlanStep {
  taskKey: TaskKey;
  status: TaskStatus;
  order: number;
}

export interface Plan {
  id: string;
  status: PlanStatus;
  steps: PlanStep[];
  createdAt: string;
}
