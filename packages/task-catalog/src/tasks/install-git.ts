import { TaskDefinition, RiskLevel } from '@vibestart/shared-types';

export const installGit: TaskDefinition = {
  taskKey: 'install_git',
  displayName: 'Git 설치',
  description: 'winget을 사용하여 Git을 설치합니다.',
  riskLevel: RiskLevel.MEDIUM,
  requiresElevation: true,
  actions: [
    {
      type: 'winget',
      command: 'winget install --id Git.Git --accept-source-agreements --accept-package-agreements',
      elevated: true,
      timeoutMs: 300000,
    },
  ],
  ui: {
    category: 'install',
    estimatedDurationMs: 120000,
  },
};
