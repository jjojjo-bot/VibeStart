/**
 * 트랙 레지스트리 — Phase 2a에서는 정적만 enabled.
 *
 * Phase 2b에서 동적/AI/이커머스 트랙 정의가 추가되면 이 파일에 import + 배열
 * 추가만 하면 된다. 마일스톤 정의 파일은 `milestones/` 하위에 트랙별 접두로
 * 구분해 관리한다.
 */

import type { MilestoneDefinition, TrackDefinition } from '@vibestart/shared-types';

import { SHARED_MILESTONE_IDS, staticMilestones, staticTrack } from './static';

const dynamicTrack: TrackDefinition = {
  id: 'dynamic',
  nameKey: 'Tracks.dynamic.name',
  taglineKey: 'Tracks.dynamic.tagline',
  milestoneIds: SHARED_MILESTONE_IDS,
  enabled: true,
  colorToken: 'green',
};

const aiTrack: TrackDefinition = {
  id: 'ai',
  nameKey: 'Tracks.ai.name',
  taglineKey: 'Tracks.ai.tagline',
  milestoneIds: SHARED_MILESTONE_IDS,
  enabled: true,
  colorToken: 'purple',
};

const ecommerceTrack: TrackDefinition = {
  id: 'ecommerce',
  nameKey: 'Tracks.ecommerce.name',
  taglineKey: 'Tracks.ecommerce.tagline',
  milestoneIds: SHARED_MILESTONE_IDS,
  enabled: true,
  colorToken: 'orange',
};

/**
 * 모든 트랙 정의 — UI 카드 렌더 순서.
 */
export const ALL_TRACKS: ReadonlyArray<TrackDefinition> = [
  staticTrack,
  dynamicTrack,
  aiTrack,
  ecommerceTrack,
];

/**
 * 트랙 ID → 해당 트랙의 마일스톤 배열 매핑.
 * enabled=false 트랙은 빈 배열.
 */
export const MILESTONES_BY_TRACK: Readonly<
  Record<TrackDefinition['id'], ReadonlyArray<MilestoneDefinition>>
> = {
  static: staticMilestones,
  dynamic: staticMilestones,
  ai: staticMilestones,
  ecommerce: staticMilestones,
};
