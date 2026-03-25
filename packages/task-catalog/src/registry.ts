import { TaskDefinition, TaskKey } from '@vibestart/shared-types';

export class TaskRegistry {
  private tasks: Map<TaskKey, TaskDefinition>;

  constructor(definitions: TaskDefinition[]) {
    this.tasks = new Map(definitions.map((d) => [d.taskKey, d]));
  }

  get(key: TaskKey): TaskDefinition | undefined {
    return this.tasks.get(key);
  }

  has(key: TaskKey): boolean {
    return this.tasks.has(key);
  }

  all(): TaskDefinition[] {
    return Array.from(this.tasks.values());
  }

  keys(): TaskKey[] {
    return Array.from(this.tasks.keys());
  }

  byCategory(category: TaskDefinition['ui']['category']): TaskDefinition[] {
    return this.all().filter((t) => t.ui.category === category);
  }
}
