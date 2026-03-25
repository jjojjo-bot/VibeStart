import { TaskDefinition, RiskLevel } from '@vibestart/shared-types';

export const npmInstall: TaskDefinition = {
  taskKey: 'npm_install',
  displayName: 'npm 패키지 설치',
  description: '프로젝트의 npm 패키지를 설치합니다.',
  riskLevel: RiskLevel.LOW,
  requiresElevation: false,
  actions: [
    {
      type: 'powershell',
      command: 'cd "{{workspacePath}}\\{{projectName}}" ; npm install',
      timeoutMs: 300000,
    },
  ],
  dependsOn: ['create_nextjs_app'],
  ui: {
    category: 'project',
    estimatedDurationMs: 60000,
  },
};
