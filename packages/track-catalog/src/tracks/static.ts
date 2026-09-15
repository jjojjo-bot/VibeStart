/**
 * 정적 웹사이트 트랙 정의.
 * 첫 배포 직후 AI로 첫 수정을 경험하는 두 단계 핵심 여정이다.
 */

import type { MilestoneDefinition, TrackDefinition } from '@vibestart/shared-types';

import { m1Deploy } from '../milestones/m1-deploy';
import { m3VibeCoding } from '../milestones/m3-vibe-coding';

export const SHARED_MILESTONE_IDS = [
  'm1-deploy',
  'm3-vibe-coding',
];

export const staticTrack: TrackDefinition = {
  id: 'static',
  nameKey: 'Tracks.static.name',
  taglineKey: 'Tracks.static.tagline',
  milestoneIds: SHARED_MILESTONE_IDS,
  enabled: true,
  colorToken: 'blue',
};

export const staticMilestones: ReadonlyArray<MilestoneDefinition> = [
  m1Deploy,
  m3VibeCoding,
];
