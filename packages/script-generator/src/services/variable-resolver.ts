export interface VariableMap {
  workspacePath: string;
  homePath: string;
  projectName: string;
  [key: string]: string;
}

export class VariableResolver {
  constructor(private variables: VariableMap) {}

  resolve(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      const value = this.variables[key];
      if (value === undefined) {
        throw new Error(`Unresolved variable: {{${key}}}`);
      }
      return value;
    });
  }

  setVariable(key: string, value: string): void {
    this.variables[key] = value;
  }
}
