/**
 * M1 — 인터넷에 내 사이트가 뜬다.
 *
 * 첫 마일스톤. 모든 트랙의 공통 출발점. 완료 시 사용자는 친구에게 보낼 수
 * 있는 진짜 `*.vercel.app` URL을 가진다.
 */

import type { MilestoneDefinition } from '@vibestart/shared-types';

export const m1Deploy: MilestoneDefinition = {
  id: 'm1-deploy',
  track: 'static',
  order: 1,
  titleKey: 'Milestones.m1-deploy.title',
  outcomeKey: 'Milestones.m1-deploy.outcome',
  shortDescriptionKey: 'Milestones.m1-deploy.short',
  previewKind: 'vercel-deploy',
  unlocks: 'm2-google-auth',
  substeps: [
    {
      id: 'm1.s1.github-oauth',
      kind: 'oauth',
      titleKey: 'Milestones.m1-deploy.substeps.m1.s1.github-oauth',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm1.s2.create-repo',
      kind: 'auto',
      titleKey: 'Milestones.m1-deploy.substeps.m1.s2.create-repo',
      externalUrl: null,
      estimatedSeconds: 10,
    },
    {
      id: 'm1.s3.vercel-oauth',
      kind: 'oauth',
      titleKey: 'Milestones.m1-deploy.substeps.m1.s3.vercel-oauth',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm1.s4.first-deploy',
      kind: 'auto',
      titleKey: 'Milestones.m1-deploy.substeps.m1.s4.first-deploy',
      externalUrl: null,
      estimatedSeconds: 90,
    },
    {
      id: 'm1.s5.verify-url',
      kind: 'verify',
      titleKey: 'Milestones.m1-deploy.substeps.m1.s5.verify-url',
      externalUrl: null,
      estimatedSeconds: null,
    },
  ],
  mcpInstalls: [
    {
      name: 'github',
      descriptionKey: 'Milestones.m1-deploy.mcp.github',
      slashCommands: ['/repo:list', '/repo:create'],
    },
    {
      name: 'vercel',
      descriptionKey: 'Milestones.m1-deploy.mcp.vercel',
      slashCommands: ['/deploy:status', '/deploy:logs'],
    },
  ],
};
