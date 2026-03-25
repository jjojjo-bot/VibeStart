export type TaskKey = string;

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface TaskAction {
  type: 'powershell' | 'winget' | 'bash' | 'brew';
  command: string;
  elevated?: boolean;
  timeoutMs?: number;
}

export interface TaskUI {
  icon?: string;
  estimatedDurationMs?: number;
  category: 'install' | 'project';
}

export interface TaskDefinition {
  taskKey: TaskKey;
  displayName: string;
  description: string;
  riskLevel: RiskLevel;
  requiresElevation: boolean;
  actions: TaskAction[];
  dependsOn?: TaskKey[];
  ui: TaskUI;
}
