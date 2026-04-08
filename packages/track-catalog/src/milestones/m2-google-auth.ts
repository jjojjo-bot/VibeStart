/**
 * M2 — 친구가 내 사이트에 가입한다.
 *
 * Supabase 프로젝트를 자동 생성하고 Google OAuth Provider를 연결한 뒤,
 * 사이트에 Auth UI 컴포넌트를 자동 삽입한다. 유일한 비-자동 단계는
 * Google OAuth 클라이언트 ID/Secret 발급 (Google Cloud Console은 API로
 * OAuth 앱 생성이 불가).
 */

import type { MilestoneDefinition } from '@vibestart/shared-types';

export const m2GoogleAuth: MilestoneDefinition = {
  id: 'm2-google-auth',
  track: 'static',
  order: 2,
  titleKey: 'Milestones.m2-google-auth.title',
  outcomeKey: 'Milestones.m2-google-auth.outcome',
  shortDescriptionKey: 'Milestones.m2-google-auth.short',
  previewKind: 'auth-form',
  unlocks: 'm3-analytics',
  substeps: [
    {
      id: 'm2.s1.supabase-oauth',
      kind: 'oauth',
      titleKey: 'Milestones.m2-google-auth.substeps.m2.s1.supabase-oauth',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm2.s2.create-supabase-project',
      kind: 'auto',
      titleKey:
        'Milestones.m2-google-auth.substeps.m2.s2.create-supabase-project',
      externalUrl: null,
      estimatedSeconds: 60,
    },
    {
      id: 'm2.s3.google-oauth-keys',
      kind: 'user-action',
      titleKey: 'Milestones.m2-google-auth.substeps.m2.s3.google-oauth-keys',
      externalUrl: 'https://console.cloud.google.com/apis/credentials',
      estimatedSeconds: null,
    },
    {
      id: 'm2.s4.enable-google-provider',
      kind: 'auto',
      titleKey:
        'Milestones.m2-google-auth.substeps.m2.s4.enable-google-provider',
      externalUrl: null,
      estimatedSeconds: 15,
    },
    {
      id: 'm2.s5.install-auth-ui',
      kind: 'auto',
      titleKey: 'Milestones.m2-google-auth.substeps.m2.s5.install-auth-ui',
      externalUrl: null,
      estimatedSeconds: 30,
    },
    {
      id: 'm2.s6.verify-signup',
      kind: 'verify',
      titleKey: 'Milestones.m2-google-auth.substeps.m2.s6.verify-signup',
      externalUrl: null,
      estimatedSeconds: null,
    },
  ],
  mcpInstalls: [
    {
      name: 'supabase',
      descriptionKey: 'Milestones.m2-google-auth.mcp.supabase',
      slashCommands: ['/db:query', '/db:add-table', '/auth:list-users'],
    },
  ],
};
