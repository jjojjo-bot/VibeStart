/**
 * M4 — 에러가 나도 내가 안다.
 *
 * Sentry 프로젝트를 자동 생성하고 DSN을 Vercel 환경변수에 주입한 뒤,
 * @sentry/nextjs 설치와 설정 파일 자동 생성까지 한다. 이 마일스톤의
 * 결정적 차별점은 Sentry MCP와 /explain-error 슬래시 커맨드 자동 등록.
 */

import type { MilestoneDefinition } from '@vibestart/shared-types';

export const m4Sentry: MilestoneDefinition = {
  id: 'm4-sentry',
  track: 'static',
  order: 4,
  titleKey: 'Milestones.m4-sentry.title',
  outcomeKey: 'Milestones.m4-sentry.outcome',
  shortDescriptionKey: 'Milestones.m4-sentry.short',
  previewKind: 'sentry-issue',
  unlocks: 'm5-domain',
  substeps: [
    {
      id: 'm4-s1-sentry-oauth',
      kind: 'oauth',
      titleKey: 'Milestones.m4-sentry.substeps.m4-s1-sentry-oauth',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm4-s2-create-sentry-project',
      kind: 'auto',
      titleKey: 'Milestones.m4-sentry.substeps.m4-s2-create-sentry-project',
      externalUrl: null,
      estimatedSeconds: 20,
    },
    {
      id: 'm4-s3-set-dsn-env',
      kind: 'auto',
      titleKey: 'Milestones.m4-sentry.substeps.m4-s3-set-dsn-env',
      externalUrl: null,
      estimatedSeconds: 10,
    },
    {
      id: 'm4-s4-install-sentry-pkg',
      kind: 'auto',
      titleKey: 'Milestones.m4-sentry.substeps.m4-s4-install-sentry-pkg',
      externalUrl: null,
      estimatedSeconds: 60,
    },
    {
      id: 'm4-s5-redeploy',
      kind: 'auto',
      titleKey: 'Milestones.m4-sentry.substeps.m4-s5-redeploy',
      externalUrl: null,
      estimatedSeconds: 90,
    },
    {
      id: 'm4-s6-verify-first-error',
      kind: 'verify',
      titleKey: 'Milestones.m4-sentry.substeps.m4-s6-verify-first-error',
      externalUrl: null,
      estimatedSeconds: null,
    },
  ],
  mcpInstalls: [
    {
      name: 'sentry',
      descriptionKey: 'Milestones.m4-sentry.mcp.sentry',
      slashCommands: ['/show-errors', '/explain-error'],
    },
  ],
};
