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
  OAuthProvider,
  Project,
  ProjectId,
  ProjectResource,
  ProjectTrack,
  ResourceType,
} from "@vibestart/shared-types";

/**
 * In-memory store에서 사용하는 ProjectResource 확장형.
 * shared-types의 ProjectResource에 createdAt이 아직 없어서 (Phase 2b Supabase
 * 이관 때 함께 정리) 여기서만 추가한다. 외부로 노출되는 시그니처는 동일.
 */
export interface StoredProjectResource extends ProjectResource {
  createdAt: string;
}

interface DummyStore {
  projects: Map<string, Project>;
  milestoneStates: Map<string, Map<MilestoneId, MilestoneState>>;
  completedSubsteps: Map<string, Map<MilestoneId, Set<string>>>;
  resources: Map<string, StoredProjectResource[]>;
}

const globalCache = globalThis as unknown as {
  __vibestartDummyStore?: DummyStore;
};

function getStore(): DummyStore {
  if (!globalCache.__vibestartDummyStore) {
    globalCache.__vibestartDummyStore = {
      projects: new Map(),
      milestoneStates: new Map(),
      completedSubsteps: new Map(),
      resources: new Map(),
    };
  }
  // Hot reload 도중 store schema가 확장되면 캐시된 구버전 store에는 새 필드가
  // 없을 수 있다. 누락된 슬롯을 안전하게 채워서 .get() 류 호출이 undefined에
  // 부딪히지 않도록 한다. 새 슬롯이 추가되면 여기에도 한 줄씩 추가할 것.
  const store = globalCache.__vibestartDummyStore;
  if (!store.resources) {
    store.resources = new Map();
  }
  return store;
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
    os: null,
    goal: null,
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

/**
 * 프로젝트와 관련된 모든 데이터(마일스톤 상태, 서브스텝, 리소스)를 삭제한다.
 * 소유권 검증은 호출자가 수행해야 한다.
 */
export function deleteDummyProject(id: string): boolean {
  const store = getStore();
  if (!store.projects.has(id)) return false;
  store.projects.delete(id);
  store.milestoneStates.delete(id);
  store.completedSubsteps.delete(id);
  store.resources.delete(id);
  return true;
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

/**
 * 서브스텝을 완료로 마킹하고, 모든 서브스텝이 완료되면 자동으로 마일스톤을
 * completed로 전환한 뒤 다음 마일스톤을 unlock(in_progress)한다.
 *
 * 카탈로그를 주입받아 완료 판정 로직을 결정한다. 호출자가 해당 트랙의
 * 마일스톤 정의를 넘겨줘야 한다 (순환 의존 방지).
 */
export function markSubstepCompleted(input: {
  projectId: string;
  milestoneId: MilestoneId;
  substepId: string;
  totalSubsteps: number;
  allMilestoneIds: ReadonlyArray<MilestoneId>;
}): { milestoneCompleted: boolean; unlockedNext: MilestoneId | null } {
  const store = getStore();

  // substep 저장
  if (!store.completedSubsteps.has(input.projectId)) {
    store.completedSubsteps.set(input.projectId, new Map());
  }
  const byMilestone = store.completedSubsteps.get(input.projectId)!;
  if (!byMilestone.has(input.milestoneId)) {
    byMilestone.set(input.milestoneId, new Set());
  }
  byMilestone.get(input.milestoneId)!.add(input.substepId);

  const completedCount = byMilestone.get(input.milestoneId)!.size;
  const isDone = completedCount >= input.totalSubsteps;

  if (!isDone) {
    return { milestoneCompleted: false, unlockedNext: null };
  }

  // 마일스톤 자체를 completed로 전환 + 다음 마일스톤 unlock
  if (!store.milestoneStates.has(input.projectId)) {
    store.milestoneStates.set(input.projectId, new Map());
  }
  const states = store.milestoneStates.get(input.projectId)!;
  states.set(input.milestoneId, "completed");

  const currentIndex = input.allMilestoneIds.indexOf(input.milestoneId);
  const nextId = input.allMilestoneIds[currentIndex + 1] ?? null;
  if (nextId) {
    states.set(nextId, "in_progress");
  }

  // 프로젝트의 currentMilestone 갱신
  const project = store.projects.get(input.projectId);
  if (project && nextId) {
    const updated: Project = {
      ...project,
      currentMilestone: currentIndex + 2, // 1-based
      updatedAt: new Date().toISOString(),
    };
    store.projects.set(input.projectId, updated);
  }

  return { milestoneCompleted: true, unlockedNext: nextId };
}

/**
 * Phase 2a 더미 store의 project_resources 슬롯.
 *
 * vibestart가 사용자 대신 만들어준 외부 리소스(GitHub repo, Vercel project,
 * Supabase project 등)를 프로젝트별로 기록한다. Phase 2b에서 Supabase의
 * `project_resources` 테이블로 이관 예정이며, 컬럼 순서/이름을 SQL 스키마와
 * 일치시켜 어댑터 작성 시 매핑 코드를 단순하게 만든다.
 */

export interface AddProjectResourceInput {
  projectId: ProjectId;
  provider: OAuthProvider;
  resourceType: ResourceType;
  externalId: string;
  url: string | null;
  metadata: Record<string, unknown>;
}

/**
 * 리소스를 추가한다. (projectId, resourceType, externalId)가 동일한 row가
 * 이미 있으면 새로 만들지 않고 기존 row를 반환한다 (idempotent). GitHub은
 * 같은 이름의 repo를 두 번 만들 수 없으므로 호출자는 이 가드를 신뢰해도 된다.
 */
export function addProjectResource(
  input: AddProjectResourceInput,
): StoredProjectResource {
  const store = getStore();
  if (!store.resources.has(input.projectId)) {
    store.resources.set(input.projectId, []);
  }
  const list = store.resources.get(input.projectId)!;

  const existing = list.find(
    (r) =>
      r.resourceType === input.resourceType &&
      r.externalId === input.externalId,
  );
  if (existing) {
    return existing;
  }

  const row: StoredProjectResource = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    provider: input.provider,
    resourceType: input.resourceType,
    externalId: input.externalId,
    url: input.url,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };
  list.push(row);
  return row;
}

/**
 * 프로젝트의 리소스 목록을 반환한다. provider 필터 선택.
 */
export function listProjectResources(
  projectId: string,
  provider?: OAuthProvider,
): ReadonlyArray<StoredProjectResource> {
  const list = getStore().resources.get(projectId) ?? [];
  if (!provider) return list;
  return list.filter((r) => r.provider === provider);
}

/**
 * 특정 resourceType의 첫 리소스를 반환한다 (없으면 null). M1 GitHub repo
 * 같은 "프로젝트당 1개" 리소스를 조회할 때 사용.
 */
export function getProjectResourceByType(
  projectId: string,
  resourceType: ResourceType,
): StoredProjectResource | null {
  const list = getStore().resources.get(projectId) ?? [];
  return list.find((r) => r.resourceType === resourceType) ?? null;
}

/**
 * 특정 resourceType의 첫 리소스 metadata에 patch를 머지한다.
 * 존재했다면 갱신된 row, 없었다면 null.
 *
 * (마)-4: supabase_project metadata에 `googleProviderEnabled: true`를 기록할 때
 * 사용. 새로운 키를 만들지 않고 in-place로 업데이트한다.
 */
export function updateProjectResourceMetadata(
  projectId: string,
  resourceType: ResourceType,
  patch: Record<string, unknown>,
): StoredProjectResource | null {
  const list = getStore().resources.get(projectId);
  if (!list) return null;
  const idx = list.findIndex((r) => r.resourceType === resourceType);
  if (idx === -1) return null;
  const current = list[idx]!;
  const updated: StoredProjectResource = {
    ...current,
    metadata: { ...current.metadata, ...patch },
  };
  list[idx] = updated;
  return updated;
}

/**
 * 특정 resourceType의 첫 리소스를 삭제한다. 존재했다면 true, 없었다면 false.
 * (마)-3 사용자가 잘못 입력한 Google OAuth 키를 수정할 때 사용.
 */
export function removeProjectResourceByType(
  projectId: string,
  resourceType: ResourceType,
): boolean {
  const list = getStore().resources.get(projectId);
  if (!list) return false;
  const idx = list.findIndex((r) => r.resourceType === resourceType);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

/**
 * 사용자가 서브스텝을 수동으로 체크 해제할 때. completed 상태 마일스톤은
 * in_progress로 되돌리고, 이후 마일스톤이 unlock 상태였다면 다시 locked로.
 * (라)-1 범위에서는 사용하지 않지만 대칭성을 위해 둠.
 */
export function unmarkSubstepCompleted(
  projectId: string,
  milestoneId: MilestoneId,
  substepId: string,
): void {
  const store = getStore();
  store.completedSubsteps.get(projectId)?.get(milestoneId)?.delete(substepId);
  const states = store.milestoneStates.get(projectId);
  if (states?.get(milestoneId) === "completed") {
    states.set(milestoneId, "in_progress");
  }
}
