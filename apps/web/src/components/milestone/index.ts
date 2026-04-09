/**
 * Phase 2a 마일스톤 UI 컴포넌트 1세트.
 *
 * 모든 컴포넌트는 도메인 타입(@vibestart/shared-types)을 기반으로 동작하며,
 * 비즈니스 로직(잠금 규칙, 진행 계산 등)은 포함하지 않는다. 그런 규칙은
 * @vibestart/track-catalog 또는 페이지 레이어가 담당한다.
 */

export { TrackBadge, type TrackBadgeProps } from "./track-badge";
export { ProgressDots, type ProgressDotsProps } from "./progress-dots";
export {
  ExtensionStatus,
  type ExtensionStatusProps,
  type ExtensionConnectionState,
} from "./extension-status";
export { ResultPreview, type ResultPreviewProps } from "./result-preview";
export {
  SubstepList,
  type SubstepListProps,
  type SubstepListLabels,
  type DisplaySubstep,
} from "./substep-list";
export {
  MilestoneCard,
  type MilestoneCardProps,
  type MilestoneCardVariant,
} from "./milestone-card";
export {
  CreateRepoPanel,
  type CreateRepoPanelProps,
  type CreateRepoPanelLabels,
  type CreateRepoPanelState,
} from "./create-repo-panel";
