"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/dal";
import {
  deleteDummyProject,
  getDummyProject,
} from "@/lib/projects/in-memory-store";

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) throw new Error("필수 파라미터 누락");

  const project = getDummyProject(projectId);
  if (!project || project.userId !== user.id) {
    throw new Error("프로젝트를 찾을 수 없습니다");
  }

  deleteDummyProject(projectId);
  revalidatePath("/dashboard");
}
