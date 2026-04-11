/**
 * @vibestart/track-catalog
 *
 * 정적 트랙 + 마일스톤 "정의"를 담는 카탈로그 패키지.
 * Phase 2a에서는 정적 트랙(포트폴리오) 5개 마일스톤만 enabled.
 *
 * 사용 예:
 *   import { createInMemoryMilestoneCatalog } from '@vibestart/track-catalog';
 *   const catalog = createInMemoryMilestoneCatalog();
 *   const track = catalog.getTrack('static');
 *   const milestones = catalog.listMilestones('static');
 */

export {
  InMemoryMilestoneCatalogAdapter,
  createInMemoryMilestoneCatalog,
} from './adapters/InMemoryMilestoneCatalogAdapter';

export { ALL_TRACKS, MILESTONES_BY_TRACK } from './tracks';
export { staticTrack, staticMilestones } from './tracks/static';

// 개별 마일스톤 re-export
export { m1Deploy } from './milestones/m1-deploy';
export { m2GoogleAuth } from './milestones/m2-google-auth';
export { m3VibeCoding } from './milestones/m3-vibe-coding';
