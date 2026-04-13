"use server";

import { revalidatePath } from "next/cache";

import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

import { getCurrentUser } from "@/lib/auth/dal";
import {
  deleteProject,
  getProject,
  updateProjectTrack,
} from "@/lib/projects/project-store";

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) throw new Error("필수 파라미터 누락");

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  await deleteProject(projectId);
  revalidatePath("/dashboard");
}

/**
 * 대시보드에서 프로젝트의 Phase 2 트랙 변경.
 *
 * Phase 2a에서는 모든 트랙이 동일한 M1/M2/M3 마일스톤을 공유하므로 트랙을
 * 바꿔도 진행 상태가 유지된다. Phase 2b에서 트랙별 고유 마일스톤이 생기면
 * 이 액션에 마이그레이션/가드 로직을 추가해야 한다.
 */
const VALID_TRACKS = ["static", "dynamic", "ai", "ecommerce"] as const;
type ValidTrack = (typeof VALID_TRACKS)[number];

export async function updateProjectTrackAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  const trackIdRaw = String(formData.get("trackId") ?? "");
  if (!projectId) throw new Error("필수 파라미터 누락");

  if (!(VALID_TRACKS as readonly string[]).includes(trackIdRaw)) {
    throw new Error("유효하지 않은 트랙");
  }
  const trackId = trackIdRaw as ValidTrack;

  const project = await getProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  const catalog = createInMemoryMilestoneCatalog();
  const trackDef = catalog.getTrack(trackId);
  if (!trackDef || !trackDef.enabled) {
    throw new Error("선택할 수 없는 트랙");
  }

  await updateProjectTrack(project.id, trackId);
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.id}`);
}
