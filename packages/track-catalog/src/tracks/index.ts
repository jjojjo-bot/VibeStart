/**
 * 트랙 레지스트리.
 *
 * 실제로 고유한 여정이 준비된 정적 웹사이트 트랙만 선택할 수 있다. 아직
 * 전용 마일스톤이 없는 트랙을 활성화해 같은 흐름을 반복 노출하지 않는다.
 */

import type { MilestoneDefinition, TrackDefinition } from '@vibestart/shared-types';

import { SHARED_MILESTONE_IDS, staticMilestones, staticTrack } from './static';

const dynamicTrack: TrackDefinition = {
  id: 'dynamic',
  nameKey: 'Tracks.dynamic.name',
  taglineKey: 'Tracks.dynamic.tagline',
  milestoneIds: SHARED_MILESTONE_IDS,
  enabled: false,
  colorToken: 'green',
};

const aiTrack: TrackDefinition = {
  id: 'ai',
  nameKey: 'Tracks.ai.name',
  taglineKey: 'Tracks.ai.tagline',
  milestoneIds: SHARED_MILESTONE_IDS,
  enabled: false,
  colorToken: 'purple',
};

const ecommerceTrack: TrackDefinition = {
  id: 'ecommerce',
  nameKey: 'Tracks.ecommerce.name',
  taglineKey: 'Tracks.ecommerce.tagline',
  milestoneIds: SHARED_MILESTONE_IDS,
  enabled: false,
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
 * 기존에 다른 트랙으로 만들어진 프로젝트도 중단되지 않도록 현재의 핵심
 * 웹사이트 여정은 유지한다. enabled 플래그는 신규 선택과 변경만 막는다.
 */
export const MILESTONES_BY_TRACK: Readonly<
  Record<TrackDefinition['id'], ReadonlyArray<MilestoneDefinition>>
> = {
  static: staticMilestones,
  dynamic: staticMilestones,
  ai: staticMilestones,
  ecommerce: staticMilestones,
};
