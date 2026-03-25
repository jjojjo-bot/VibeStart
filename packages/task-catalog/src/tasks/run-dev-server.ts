import { TaskDefinition, RiskLevel } from '@vibestart/shared-types';

export const runDevServer: TaskDefinition = {
  taskKey: 'run_dev_server',
  displayName: '개발 서버 실행',
  description: 'Next.js 개발 서버를 실행하고 브라우저에서 확인합니다.',
  riskLevel: RiskLevel.LOW,
  requiresElevation: false,
  actions: [
    {
      type: 'powershell',
      command: 'cd "{{workspacePath}}\\{{projectName}}" ; npm run dev',
      timeoutMs: 30000,
    },
  ],
  dependsOn: ['npm_install'],
  ui: {
    category: 'project',
    estimatedDurationMs: 15000,
  },
};
