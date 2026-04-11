/**
 * M3 — 바이브코딩으로 내 사이트 바꿔보기.
 *
 * AI 도구(Cursor / Claude Code)로 프로젝트를 열고, 자연어로 수정 요청을
 * 한 뒤 git push → 자동 배포 → 결과 확인까지 바이브코딩 루프를 완성한다.
 */

import type { MilestoneDefinition } from '@vibestart/shared-types';

export const m3VibeCoding: MilestoneDefinition = {
  id: 'm3-vibe-coding',
  track: 'static',
  order: 3,
  titleKey: 'Milestones.m3-vibe-coding.title',
  outcomeKey: 'Milestones.m3-vibe-coding.outcome',
  shortDescriptionKey: 'Milestones.m3-vibe-coding.short',
  previewKind: 'vibe-coding-diff',
  unlocks: null,
  substeps: [
    {
      id: 'm3-s1-open-editor',
      kind: 'user-action',
      titleKey: 'Milestones.m3-vibe-coding.substeps.m3-s1-open-editor',
      externalUrl: null,
      estimatedSeconds: null,
    },
    {
      id: 'm3-s2-first-ai-edit',
      kind: 'copy-paste',
      titleKey: 'Milestones.m3-vibe-coding.substeps.m3-s2-first-ai-edit',
      externalUrl: null,
      estimatedSeconds: null,
    },
    {
      id: 'm3-s3-git-push',
      kind: 'copy-paste',
      titleKey: 'Milestones.m3-vibe-coding.substeps.m3-s3-git-push',
      externalUrl: null,
      estimatedSeconds: null,
    },
    {
      id: 'm3-s4-verify-deploy',
      kind: 'verify',
      titleKey: 'Milestones.m3-vibe-coding.substeps.m3-s4-verify-deploy',
      externalUrl: null,
      estimatedSeconds: null,
    },
  ],
  mcpInstalls: [],
};
