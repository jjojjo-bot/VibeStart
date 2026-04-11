/**
 * 정적 트랙 (포트폴리오, 랜딩 페이지) 정의.
 * Phase 2a에서 유일하게 enabled=true인 트랙.
 */

import type { MilestoneDefinition, TrackDefinition } from '@vibestart/shared-types';

import { m1Deploy } from '../milestones/m1-deploy';
import { m2GoogleAuth } from '../milestones/m2-google-auth';
import { m3VibeCoding } from '../milestones/m3-vibe-coding';

export const staticTrack: TrackDefinition = {
  id: 'static',
  nameKey: 'Tracks.static.name',
  taglineKey: 'Tracks.static.tagline',
  milestoneIds: [
    'm1-deploy',
    'm2-google-auth',
    'm3-vibe-coding',
  ],
  enabled: true,
  colorToken: 'blue',
};

export const staticMilestones: ReadonlyArray<MilestoneDefinition> = [
  m1Deploy,
  m2GoogleAuth,
  m3VibeCoding,
];
