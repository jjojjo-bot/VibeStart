/**
 * MilestoneDefinitionPort — 트랙/마일스톤의 "정의"(카탈로그)를 조회하는 포트.
 *
 * 1순위 어댑터: @vibestart/track-catalog의 InMemoryMilestoneCatalogAdapter
 * (정적 데이터 기반). 다른 포트들과 달리 동기 메서드다 — 카탈로그는 빌드
 * 타임에 고정되는 상수이기 때문. 미래에 DB로 옮길 계획도 없다: 카탈로그가
 * 코드 배포와 동기화되어야 하므로 소스에 두는 편이 안전하다.
 *
 * 이 포트는 사용자별 "진행 상태"(MilestoneStatus)를 반환하지 않는다.
 * 진행 상태 조회는 다른 포트(Phase 2b의 ProjectRepositoryPort 등)가 맡는다.
 */

import type {
  MilestoneDefinition,
  MilestoneId,
  ProjectTrack,
  TrackDefinition,
} from '@vibestart/shared-types';

export interface MilestoneDefinitionPort {
  /**
   * 모든 트랙을 정의 순서대로 반환한다.
   * Phase 2a에서는 정적(enabled=true) + 동적/AI/이커머스(enabled=false) 4개.
   */
  listTracks(): ReadonlyArray<TrackDefinition>;

  /**
   * 특정 트랙 정의. 없으면 null.
   */
  getTrack(trackId: ProjectTrack): TrackDefinition | null;

  /**
   * 특정 트랙의 마일스톤을 order 순서대로 반환한다.
   */
  listMilestones(trackId: ProjectTrack): ReadonlyArray<MilestoneDefinition>;

  /**
   * 특정 트랙·마일스톤 정의. 없으면 null.
   */
  getMilestone(
    trackId: ProjectTrack,
    milestoneId: MilestoneId,
  ): MilestoneDefinition | null;
}
