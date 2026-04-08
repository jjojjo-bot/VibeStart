/**
 * Phase 2 — 트랙(Track) 정의 도메인 타입.
 *
 * 트랙은 사용자가 /projects/new에서 선택하는 프로젝트 종류(정적/동적/
 * AI/이커머스)이며, 각 트랙은 서로 다른 마일스톤 순서를 가진다.
 *
 * Phase 2a에서는 정적 트랙만 `enabled: true`이고 나머지 3개는
 * `comingSoon`으로 표시된다.
 */

import type { MilestoneId, ProjectTrack } from './project.types';

/**
 * 트랙 카드의 강조 색상 토큰. 컴포넌트가 CSS 변수로 매핑한다.
 * 기존 브랜드 퍼플과는 독립적으로 트랙 식별용.
 */
export type TrackColorToken = 'blue' | 'green' | 'purple' | 'orange';

export interface TrackDefinition {
  id: ProjectTrack;
  /** i18n 키 — 'Tracks.static.name' */
  nameKey: string;
  /** i18n 키 — 한 줄 태그라인 */
  taglineKey: string;
  /** 트랙이 포함하는 마일스톤 ID 목록 (순서대로) */
  milestoneIds: ReadonlyArray<MilestoneId>;
  /** Phase 2a에서는 정적만 true. 나머지는 false */
  enabled: boolean;
  colorToken: TrackColorToken;
}
