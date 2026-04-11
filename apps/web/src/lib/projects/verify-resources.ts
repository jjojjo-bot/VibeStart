/**
 * 외부 리소스(GitHub repo, Vercel project 등)의 실제 존재 여부를 검증한다.
 *
 * 마일스톤 페이지 로드 시 호출되어, DB에는 기록이 있지만 외부에서 삭제된
 * 리소스를 감지하고 project_resources에서 정리한다.
 */

import "server-only";

import { fetchGitHubRepoIfExists } from "@/lib/adapters/github/github-adapter";
import { getLatestDeployment } from "@/lib/adapters/vercel/vercel-adapter";
import { getOAuthAccessToken } from "@/lib/auth/oauth-connections";
import {
  getProjectResourceByType,
  removeProjectResourceByType,
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
    }
  }

  // 2) Vercel project 검증
  const vercelResource = await getProjectResourceByType(projectId, "vercel_project");
  if (vercelResource) {
    const result = await verifyVercelProject(vercelResource, userId);
    results.push({ resourceType: "vercel_project", status: result });
    if (result === "gone") {
      await removeProjectResourceByType(projectId, "vercel_project");
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

    const deployment = await getLatestDeployment(token, resource.externalId);
    // deployment가 null이어도 프로젝트 자체는 존재할 수 있음
    // 404 에러가 발생하면 gone으로 처리
    return deployment !== null ? "valid" : "gone";
  } catch (err) {
    // 404 = 프로젝트 삭제됨
    if (err instanceof Error && err.message.includes("404")) {
      return "gone";
    }
    return "skipped";
  }
}
