/**
 * M5 — 진짜 도메인이 붙는다.
 *
 * 정적 트랙의 마지막 마일스톤. 도메인 결제 자체는 사용자가 Cloudflare
 * Registrar에서 직접 해야 하지만(약 1만원/년), 검색·DNS 설정·Vercel 연결·
 * SSL 발급은 vibestart가 자동화.
 */

import type { MilestoneDefinition } from '@vibestart/shared-types';

export const m5Domain: MilestoneDefinition = {
  id: 'm5-domain',
  track: 'static',
  order: 5,
  titleKey: 'Milestones.m5-domain.title',
  outcomeKey: 'Milestones.m5-domain.outcome',
  shortDescriptionKey: 'Milestones.m5-domain.short',
  previewKind: 'domain-banner',
  unlocks: null,
  substeps: [
    {
      id: 'm5-s1-search-domain',
      kind: 'auto',
      titleKey: 'Milestones.m5-domain.substeps.m5-s1-search-domain',
      externalUrl: null,
      estimatedSeconds: 15,
    },
    {
      id: 'm5-s2-user-purchase',
      kind: 'user-action',
      titleKey: 'Milestones.m5-domain.substeps.m5-s2-user-purchase',
      externalUrl: 'https://dash.cloudflare.com/?to=/:account/domains/register',
      estimatedSeconds: null,
    },
    {
      id: 'm5-s3-cloudflare-oauth',
      kind: 'oauth',
      titleKey: 'Milestones.m5-domain.substeps.m5-s3-cloudflare-oauth',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm5-s4-apply-dns',
      kind: 'auto',
      titleKey: 'Milestones.m5-domain.substeps.m5-s4-apply-dns',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm5-s5-add-to-vercel',
      kind: 'auto',
      titleKey: 'Milestones.m5-domain.substeps.m5-s5-add-to-vercel',
      externalUrl: null,
      estimatedSeconds: 20,
    },
    {
      id: 'm5-s6-wait-ssl',
      kind: 'auto',
      titleKey: 'Milestones.m5-domain.substeps.m5-s6-wait-ssl',
      externalUrl: null,
      estimatedSeconds: 600,
    },
    {
      id: 'm5-s7-verify-connected',
      kind: 'verify',
      titleKey: 'Milestones.m5-domain.substeps.m5-s7-verify-connected',
      externalUrl: null,
      estimatedSeconds: null,
    },
  ],
  mcpInstalls: [
    {
      name: 'cloudflare',
      descriptionKey: 'Milestones.m5-domain.mcp.cloudflare',
      slashCommands: ['/domain:check', '/domain:add-redirect'],
    },
  ],
};
