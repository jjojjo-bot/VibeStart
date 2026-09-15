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
 * 전용 여정이 준비된 트랙만 서버에서 허용한다. 현재 UI에서는 트랙 변경을
 * 노출하지 않지만 기존 호출을 안전하게 거부하기 위해 액션 검증을 유지한다.
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
