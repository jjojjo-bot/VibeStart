/**
 * Phase 2b — 프로젝트 영구 저장소 (Supabase DB).
 *
 * in-memory-store.ts를 대체한다. 함수 시그니처를 최대한 유지하되,
 * 모든 함수가 async로 전환된다 (DB I/O).
 *
 * RLS가 활성화되어 있으므로 createAuthServerClient()로 생성한
 * 클라이언트를 사용해야 auth.uid()가 전달된다.
 */

import "server-only";

import type {
  MilestoneId,
  MilestoneState,
  OAuthProvider,
  Project,
  ProjectGoal,
  ProjectId,
  ProjectOs,
  ProjectResource,
  ProjectTrack,
  ResourceType,
} from "@vibestart/shared-types";

import { createAuthServerClient } from "@/lib/supabase/auth-server";

// ─── 타입 ───────────────────────────────────────────────

export interface StoredProjectResource extends ProjectResource {
  createdAt: string;
}

export interface CreateProjectInput {
  userId: string;
  track: ProjectTrack;
  name: string;
  os?: ProjectOs | null;
  goal?: ProjectGoal | null;
}

export interface AddProjectResourceInput {
  projectId: ProjectId;
  provider: OAuthProvider;
  resourceType: ResourceType;
  externalId: string;
  url: string | null;
  metadata: Record<string, unknown>;
}

// ─── 헬퍼 ───────────────────────────────────────────────

function toSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "untitled";
}

/** DB snake_case row → 앱 camelCase Project */
function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    slug: row.slug as string,
    track: row.track as ProjectTrack,
    os: (row.os as ProjectOs) ?? null,
    goal: (row.goal as ProjectGoal) ?? null,
    currentMilestone: row.current_milestone as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** DB row → StoredProjectResource */
function rowToResource(row: Record<string, unknown>): StoredProjectResource {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    provider: row.provider as OAuthProvider,
    resourceType: row.resource_type as ResourceType,
    externalId: row.external_id as string,
    url: (row.url as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

// ─── 프로젝트 CRUD ──────────────────────────────────────

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: input.userId,
      name: input.name,
      slug: toSlug(input.name),
      track: input.track,
      os: input.os ?? null,
      goal: input.goal ?? null,
      current_milestone: 1,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`프로젝트 생성 실패: ${error?.message ?? "unknown"}`);
  }
  return rowToProject(data);
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select()
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToProject(data);
}

export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToProject);
}

/**
 * 프로젝트와 관련된 모든 데이터를 삭제한다.
 * ON DELETE CASCADE로 completed_substeps, project_resources도 자동 삭제.
 */
export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createAuthServerClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  return !error;
}

// ─── 마일스톤 진행 상태 ─────────────────────────────────

export async function getProjectProgress(
  projectId: string,
  milestoneIds: ReadonlyArray<MilestoneId>,
): Promise<Record<MilestoneId, MilestoneState>> {
  const supabase = await createAuthServerClient();

  // 완료된 서브스텝을 마일스톤별로 그룹핑
  const { data: substeps } = await supabase
    .from("completed_substeps")
    .select("milestone_id, substep_id")
    .eq("project_id", projectId);

  // 프로젝트의 current_milestone 조회
  const { data: project } = await supabase
    .from("projects")
    .select("current_milestone")
    .eq("id", projectId)
    .single();

  const currentMilestone = project?.current_milestone ?? 1;

  // 마일스톤별 완료된 substep 수 계산
  const completedByMilestone = new Map<string, number>();
  for (const row of substeps ?? []) {
    const mid = row.milestone_id as string;
    completedByMilestone.set(mid, (completedByMilestone.get(mid) ?? 0) + 1);
  }

  const result: Record<MilestoneId, MilestoneState> = {};
  for (let i = 0; i < milestoneIds.length; i++) {
    const mid = milestoneIds[i]!;
    const milestoneOrder = i + 1; // 1-based

    if (milestoneOrder < currentMilestone) {
      result[mid] = "completed";
    } else if (milestoneOrder === currentMilestone) {
      result[mid] = "in_progress";
    } else {
      result[mid] = "locked";
    }
  }

  return result;
}

export async function getCompletedSubstepIds(
  projectId: string,
  milestoneId: MilestoneId,
): Promise<ReadonlyArray<string>> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("completed_substeps")
    .select("substep_id")
    .eq("project_id", projectId)
    .eq("milestone_id", milestoneId);

  return (data ?? []).map((r) => r.substep_id as string);
}

export async function markSubstepCompleted(input: {
  projectId: string;
  milestoneId: MilestoneId;
  substepId: string;
  totalSubsteps: number;
  allMilestoneIds: ReadonlyArray<MilestoneId>;
}): Promise<{ milestoneCompleted: boolean; unlockedNext: MilestoneId | null }> {
  const supabase = await createAuthServerClient();

  // substep 저장 (이미 있으면 무시 — unique constraint)
  await supabase.from("completed_substeps").upsert(
    {
      project_id: input.projectId,
      milestone_id: input.milestoneId,
      substep_id: input.substepId,
    },
    { onConflict: "project_id,milestone_id,substep_id" },
  );

  // 해당 마일스톤의 완료된 substep 수 조회
  const { count } = await supabase
    .from("completed_substeps")
    .select("id", { count: "exact", head: true })
    .eq("project_id", input.projectId)
    .eq("milestone_id", input.milestoneId);

  const completedCount = count ?? 0;
  const isDone = completedCount >= input.totalSubsteps;

  if (!isDone) {
    return { milestoneCompleted: false, unlockedNext: null };
  }

  // 마일스톤 완료 → 다음 마일스톤으로 전진
  const currentIndex = input.allMilestoneIds.indexOf(input.milestoneId);
  const nextId = input.allMilestoneIds[currentIndex + 1] ?? null;

  await supabase
    .from("projects")
    .update({ current_milestone: currentIndex + 2 }) // 1-based
    .eq("id", input.projectId);

  return { milestoneCompleted: true, unlockedNext: nextId };
}

export async function unmarkSubstepCompleted(
  projectId: string,
  milestoneId: MilestoneId,
  substepId: string,
): Promise<void> {
  const supabase = await createAuthServerClient();

  await supabase
    .from("completed_substeps")
    .delete()
    .eq("project_id", projectId)
    .eq("milestone_id", milestoneId)
    .eq("substep_id", substepId);

  // 마일스톤이 completed 상태에서 substep을 해제하면
  // current_milestone을 되돌려야 한다. 예: M1 완료 후 리소스 삭제 →
  // current_milestone을 M1(=1)으로 되돌려야 "다음 마일스톤" 버튼이 사라짐.
  const { data: project } = await supabase
    .from("projects")
    .select("current_milestone")
    .eq("id", projectId)
    .single();

  if (project) {
    // milestoneId에서 순서 추출 (m1-deploy → order 1, m2-google-auth → order 2)
    // 해당 마일스톤의 1-based 순서보다 current_milestone이 높으면 되돌림
    const milestoneOrder = getMilestoneOrder(milestoneId);
    if (milestoneOrder !== null && project.current_milestone > milestoneOrder) {
      await supabase
        .from("projects")
        .update({ current_milestone: milestoneOrder })
        .eq("id", projectId);
    }
  }
}

/** milestoneId → 1-based order. 카탈로그 없이 ID 패턴으로 추출. */
function getMilestoneOrder(milestoneId: MilestoneId): number | null {
  const match = milestoneId.match(/^m(\d+)-/);
  return match ? Number(match[1]) : null;
}

// ─── 프로젝트 리소스 ────────────────────────────────────

export async function addProjectResource(
  input: AddProjectResourceInput,
): Promise<StoredProjectResource> {
  const supabase = await createAuthServerClient();

  // 이미 존재하면 기존 row 반환 (idempotent)
  const { data: existing } = await supabase
    .from("project_resources")
    .select()
    .eq("project_id", input.projectId)
    .eq("resource_type", input.resourceType)
    .eq("external_id", input.externalId)
    .single();

  if (existing) {
    return rowToResource(existing);
  }

  const { data, error } = await supabase
    .from("project_resources")
    .insert({
      project_id: input.projectId,
      provider: input.provider,
      resource_type: input.resourceType,
      external_id: input.externalId,
      url: input.url,
      metadata: input.metadata,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`리소스 추가 실패: ${error?.message ?? "unknown"}`);
  }
  return rowToResource(data);
}

export async function listProjectResources(
  projectId: string,
  provider?: OAuthProvider,
): Promise<ReadonlyArray<StoredProjectResource>> {
  const supabase = await createAuthServerClient();
  let query = supabase
    .from("project_resources")
    .select()
    .eq("project_id", projectId);

  if (provider) {
    query = query.eq("provider", provider);
  }

  const { data } = await query;
  return (data ?? []).map(rowToResource);
}

export async function getProjectResourceByType(
  projectId: string,
  resourceType: ResourceType,
): Promise<StoredProjectResource | null> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("project_resources")
    .select()
    .eq("project_id", projectId)
    .eq("resource_type", resourceType)
    .limit(1)
    .single();

  if (!data) return null;
  return rowToResource(data);
}

export async function updateProjectResourceMetadata(
  projectId: string,
  resourceType: ResourceType,
  patch: Record<string, unknown>,
): Promise<StoredProjectResource | null> {
  const supabase = await createAuthServerClient();

  // 기존 metadata 조회
  const existing = await getProjectResourceByType(projectId, resourceType);
  if (!existing) return null;

  const mergedMetadata = { ...existing.metadata, ...patch };

  const { data, error } = await supabase
    .from("project_resources")
    .update({ metadata: mergedMetadata })
    .eq("id", existing.id)
    .select()
    .single();

  if (error || !data) return null;
  return rowToResource(data);
}

export async function removeProjectResourceByType(
  projectId: string,
  resourceType: ResourceType,
): Promise<boolean> {
  const supabase = await createAuthServerClient();

  const existing = await getProjectResourceByType(projectId, resourceType);
  if (!existing) return false;

  const { error } = await supabase
    .from("project_resources")
    .delete()
    .eq("id", existing.id);

  return !error;
}
