import { TaskDefinition, RiskLevel } from '@vibestart/shared-types';

export const createNextjsApp: TaskDefinition = {
  taskKey: 'create_nextjs_app',
  displayName: 'Next.js 프로젝트 생성',
  description: 'Next.js 스타터 프로젝트를 생성합니다.',
  riskLevel: RiskLevel.LOW,
  requiresElevation: false,
  actions: [
    {
      type: 'powershell',
      command:
        'npx create-next-app@latest "{{workspacePath}}\\{{projectName}}" --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm',
      timeoutMs: 300000,
    },
  ],
  dependsOn: ['install_vscode'],
  ui: {
    category: 'project',
    estimatedDurationMs: 60000,
  },
};
