/**
 * 외부 리소스(GitHub repo, Vercel project 등)의 실제 존재 여부를 검증한다.
 *
 * 마일스톤 페이지 로드 시 호출되어, DB에는 기록이 있지만 외부에서 삭제된
 * 리소스를 감지하고 project_resources에서 정리한다.
 */

import "server-only";

import { fetchGitHubRepoIfExists } from "@/lib/adapters/github/github-adapter";
import { vercelProjectExists } from "@/lib/adapters/vercel/vercel-adapter";
import { getOAuthAccessToken } from "@/lib/auth/oauth-connections";
import {
  getProjectResourceByType,
  removeProjectResourceByType,
  unmarkSubstepCompleted,
  type StoredProjectResource,
} from "@/lib/projects/project-store";

export interface VerificationResult {
  resourceType: string;
  status: "valid" | "gone" | "skipped";
}

/**
 * 프로젝트의 외부 리소스 존재 여부를 검증하고, 삭제된 리소스는 DB에서 제거한다.
 * 토큰이 없거나 API 호출 실패 시에는 "skipped"로 처리 (사용자에게 불이익 없음).
 */
export async function verifyProjectResources(
  projectId: string,
  userId: string,
): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // 1) GitHub repo 검증
  const githubResource = await getProjectResourceByType(projectId, "github_repo");
  if (githubResource) {
    const result = await verifyGitHubRepo(githubResource, userId);
    results.push({ resourceType: "github_repo", status: result });
    if (result === "gone") {
      await removeProjectResourceByType(projectId, "github_repo");
      // 관련 substep 완료 상태도 정리
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s2-create-repo");
    }
  }

  // 2) Vercel project 검증
  const vercelResource = await getProjectResourceByType(projectId, "vercel_project");
  if (vercelResource) {
    const result = await verifyVercelProject(vercelResource, userId);
    results.push({ resourceType: "vercel_project", status: result });
    if (result === "gone") {
      await removeProjectResourceByType(projectId, "vercel_project");
      // 배포 관련 substep 완료 상태도 정리
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s4-first-deploy");
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s5-verify-url");
    }
  }

  return results;
}

async function verifyGitHubRepo(
  resource: StoredProjectResource,
  userId: string,
): Promise<"valid" | "gone" | "skipped"> {
  try {
    const token = await getOAuthAccessToken(userId, "github");
    if (!token) return "skipped";

    const [owner, repoName] = resource.externalId.split("/");
    if (!owner || !repoName) return "skipped";

    const repo = await fetchGitHubRepoIfExists(token, owner, repoName);
    return repo ? "valid" : "gone";
  } catch {
    // API 호출 실패 시 안전하게 skipped 처리
    return "skipped";
  }
}

async function verifyVercelProject(
  resource: StoredProjectResource,
  userId: string,
): Promise<"valid" | "gone" | "skipped"> {
  try {
    const token = await getOAuthAccessToken(userId, "vercel");
    if (!token) return "skipped";

    const exists = await vercelProjectExists(token, resource.externalId);
    return exists ? "valid" : "gone";
  } catch {
    return "skipped";
  }
}
