/**
 * M3 — 누가 내 사이트에 왔는지 본다.
 *
 * Vercel Web Analytics와 Google Analytics 4를 동시에 켠다. GA4 측정 ID는
 * Google Analytics Admin API가 제한적이라 사용자가 직접 콘솔에서 만들어
 * 입력해야 한다.
 */

import type { MilestoneDefinition } from '@vibestart/shared-types';

export const m3Analytics: MilestoneDefinition = {
  id: 'm3-analytics',
  track: 'static',
  order: 3,
  titleKey: 'Milestones.m3-analytics.title',
  outcomeKey: 'Milestones.m3-analytics.outcome',
  shortDescriptionKey: 'Milestones.m3-analytics.short',
  previewKind: 'analytics-chart',
  unlocks: 'm4-sentry',
  substeps: [
    {
      id: 'm3-s1-enable-vercel-analytics',
      kind: 'auto',
      titleKey: 'Milestones.m3-analytics.substeps.m3-s1-enable-vercel-analytics',
      externalUrl: null,
      estimatedSeconds: 15,
    },
    {
      id: 'm3-s2-install-vercel-analytics-pkg',
      kind: 'auto',
      titleKey:
        'Milestones.m3-analytics.substeps.m3-s2-install-vercel-analytics-pkg',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm3-s3-create-ga4-property',
      kind: 'user-action',
      titleKey: 'Milestones.m3-analytics.substeps.m3-s3-create-ga4-property',
      externalUrl: 'https://analytics.google.com/analytics/web/',
      estimatedSeconds: null,
    },
    {
      id: 'm3-s4-paste-measurement-id',
      kind: 'auto',
      titleKey: 'Milestones.m3-analytics.substeps.m3-s4-paste-measurement-id',
      externalUrl: null,
      estimatedSeconds: 10,
    },
    {
      id: 'm3-s5-verify-events',
      kind: 'verify',
      titleKey: 'Milestones.m3-analytics.substeps.m3-s5-verify-events',
      externalUrl: null,
      estimatedSeconds: null,
    },
  ],
  mcpInstalls: [
    {
      name: 'vercel-analytics',
      descriptionKey: 'Milestones.m3-analytics.mcp.vercel-analytics',
      slashCommands: ['/traffic:today', '/traffic:week'],
    },
  ],
};
