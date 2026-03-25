import { TaskDefinition, RiskLevel } from '@vibestart/shared-types';

export const installNodeLts: TaskDefinition = {
  taskKey: 'install_node_lts',
  displayName: 'Node.js LTS 설치',
  description: 'winget을 사용하여 Node.js LTS 버전을 설치합니다.',
  riskLevel: RiskLevel.MEDIUM,
  requiresElevation: true,
  actions: [
    {
      type: 'winget',
      command:
        'winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements',
      elevated: true,
      timeoutMs: 300000,
    },
  ],
  dependsOn: ['install_git'],
  ui: {
    category: 'install',
    estimatedDurationMs: 180000,
  },
};
