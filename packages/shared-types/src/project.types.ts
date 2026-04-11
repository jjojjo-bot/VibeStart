/**
 * Phase 2 — 사용자가 만든 프로젝트와 마일스톤 진행 상태.
 *
 * 트랙(track)은 시작 시 1회 선택하며, 각 트랙은 서로 다른 마일스톤
 * 트리를 가진다 (정적 5개, 동적 8개, AI 9개, 이커머스 10개).
 */

import type { UserId } from './auth.types';

export type ProjectId = string;
export type MilestoneId = string;

export type ProjectTrack = 'static' | 'dynamic' | 'ai' | 'ecommerce';
export type ProjectOs = 'macos' | 'windows';
export type ProjectGoal =
  | 'web-nextjs'
  | 'web-python'
  | 'web-java'
  | 'mobile'
  | 'data-ai'
  | 'not-sure';

export type MilestoneState =
  | 'locked'
  | 'in_progress'
  | 'completed'
  | 'failed';

export interface Project {
  id: ProjectId;
  userId: UserId;
  name: string;
  slug: string;
  track: ProjectTrack;
  os: ProjectOs | null;
  goal: ProjectGoal | null;
  currentMilestone: number;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneStatus {
  id: string;
  projectId: ProjectId;
  milestoneId: MilestoneId;
  state: MilestoneState;
  startedAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}
