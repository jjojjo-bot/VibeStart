/**
 * Phase 2a 더미 프로젝트 in-memory store.
 *
 * 사용자 프로젝트/마일스톤 진행 상태를 메모리에 임시 저장한다. Next.js dev
 * 서버의 hot reload 동안 store가 초기화되지 않도록 globalThis에 캐시한다.
 * 프로덕션 배포에서는 Supabase로 교체될 예정이며, 이 모듈은 그 시점에
 * ProjectRepositoryPort 어댑터로 재작성된다. 함수 시그니처를 유지하면
 * 호출부 변경 없이 교체 가능.
 *
 * **이 파일은 임시 mock이다**. TODO(Phase 2b): ProjectRepositoryPort 도입.
 */

import "server-only";

import type {
  MilestoneId,
  MilestoneState,
  Project,
  ProjectTrack,
} from "@vibestart/shared-types";

interface DummyStore {
  projects: Map<string, Project>;
  milestoneStates: Map<string, Map<MilestoneId, MilestoneState>>;
  completedSubsteps: Map<string, Map<MilestoneId, Set<string>>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalCache = globalThis as unknown as {
  __vibestartDummyStore?: DummyStore;
};

function getStore(): DummyStore {
  if (!globalCache.__vibestartDummyStore) {
    globalCache.__vibestartDummyStore = {
      projects: new Map(),
      milestoneStates: new Map(),
      completedSubsteps: new Map(),
    };
  }
  return globalCache.__vibestartDummyStore;
}

function toSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "untitled";
}

export interface CreateProjectInput {
  userId: string;
  track: ProjectTrack;
  name: string;
}

export function createDummyProject(input: CreateProjectInput): Project {
  const store = getStore();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const project: Project = {
    id,
    userId: input.userId,
    name: input.name,
    slug: toSlug(input.name),
    track: input.track,
    currentMilestone: 1,
    createdAt: now,
    updatedAt: now,
  };
  store.projects.set(id, project);
  store.milestoneStates.set(id, new Map());
  store.completedSubsteps.set(id, new Map());
  return project;
}

export function getDummyProject(id: string): Project | null {
  return getStore().projects.get(id) ?? null;
}

export function listDummyProjects(userId: string): Project[] {
  return Array.from(getStore().projects.values())
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 프로젝트의 모든 마일스톤 상태를 조회한다. 저장된 상태가 없으면 기본값
 * (첫 마일스톤=in_progress, 나머지=locked)을 사용한다.
 */
export function getProjectProgress(
  projectId: string,
  milestoneIds: ReadonlyArray<MilestoneId>,
): Record<MilestoneId, MilestoneState> {
  const store = getStore();
  const stored = store.milestoneStates.get(projectId) ?? new Map();
  const result: Record<MilestoneId, MilestoneState> = {};
  for (let i = 0; i < milestoneIds.length; i++) {
    const mid = milestoneIds[i]!;
    const state = stored.get(mid);
    result[mid] = state ?? (i === 0 ? "in_progress" : "locked");
  }
  return result;
}

export function getCompletedSubstepIds(
  projectId: string,
  milestoneId: MilestoneId,
): ReadonlyArray<string> {
  const set = getStore().completedSubsteps.get(projectId)?.get(milestoneId);
  return set ? Array.from(set) : [];
}
