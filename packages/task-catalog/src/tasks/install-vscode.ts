import { TaskDefinition, RiskLevel } from '@vibestart/shared-types';

export const installVscode: TaskDefinition = {
  taskKey: 'install_vscode',
  displayName: 'VS Code 설치',
  description: 'winget을 사용하여 Visual Studio Code를 설치합니다.',
  riskLevel: RiskLevel.MEDIUM,
  requiresElevation: true,
  actions: [
    {
      type: 'winget',
      command:
        'winget install --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements',
      elevated: true,
      timeoutMs: 300000,
    },
  ],
  dependsOn: ['install_node_lts'],
  ui: {
    category: 'install',
    estimatedDurationMs: 180000,
  },
};
