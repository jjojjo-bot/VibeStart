/**
 * @vibestart/track-catalog
 *
 * 웹사이트 트랙 + 마일스톤 "정의"를 담는 카탈로그 패키지.
 * 실제 사용자 여정에는 첫 배포와 AI 첫 수정만 노출한다.
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
