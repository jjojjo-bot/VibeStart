/**
 * MilestoneDefinitionPort의 인메모리 어댑터.
 *
 * 카탈로그는 빌드 타임에 고정되는 정적 데이터이므로 동기 메서드로 구현한다.
 * 모든 조회는 O(1~N) — 트랙 4개·마일스톤 최대 10개 규모에서 성능 걱정 없음.
 */

import type { MilestoneDefinitionPort } from '@vibestart/ports';
import type {
  MilestoneDefinition,
  MilestoneId,
  ProjectTrack,
  TrackDefinition,
} from '@vibestart/shared-types';

import { ALL_TRACKS, MILESTONES_BY_TRACK } from '../tracks';

export class InMemoryMilestoneCatalogAdapter
  implements MilestoneDefinitionPort
{
  listTracks(): ReadonlyArray<TrackDefinition> {
    return ALL_TRACKS;
  }

  getTrack(trackId: ProjectTrack): TrackDefinition | null {
    return ALL_TRACKS.find((t) => t.id === trackId) ?? null;
  }

  listMilestones(trackId: ProjectTrack): ReadonlyArray<MilestoneDefinition> {
    return MILESTONES_BY_TRACK[trackId];
  }

  getMilestone(
    trackId: ProjectTrack,
    milestoneId: MilestoneId,
  ): MilestoneDefinition | null {
    const milestones = MILESTONES_BY_TRACK[trackId];
    return milestones.find((m) => m.id === milestoneId) ?? null;
  }
}

/**
 * 단일 인스턴스 팩토리. 카탈로그는 불변이므로 모듈 스코프 싱글턴으로 충분하다.
 * 테스트에서 다른 인스턴스가 필요하면 `new InMemoryMilestoneCatalogAdapter()`
 * 를 직접 호출.
 */
let singleton: MilestoneDefinitionPort | null = null;

export function createInMemoryMilestoneCatalog(): MilestoneDefinitionPort {
  if (!singleton) {
    singleton = new InMemoryMilestoneCatalogAdapter();
  }
  return singleton;
}
