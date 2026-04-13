/**
 * 외부 리소스(GitHub repo, Vercel project 등)의 실제 존재 여부를 검증한다.
 *
 * 마일스톤 페이지 로드 시 호출되어, DB에는 기록이 있지만 외부에서 삭제된
 * 리소스를 감지하고 project_resources + completed_substeps를 한 번에 정리한다.
 *
 * 핵심 원칙: 이 함수가 끝난 시점에 DB 상태가 완전히 정리되어야 한다.
 * 페이지에서 다시 조회할 때 정리된 상태가 바로 반영되도록.
 */

import "server-only";

import { fetchGitHubRepoIfExists } from "@/lib/adapters/github/github-adapter";
import { vercelProjectExists } from "@/lib/adapters/vercel/vercel-adapter";
import { getSupabaseProject } from "@/lib/adapters/supabase-mgmt/supabase-mgmt-adapter";
import { getOAuthAccessToken } from "@/lib/auth/oauth-connections";
import {
  getCompletedSubstepIds,
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
 * 리소스 삭제 + substep 삭제를 한 번의 호출에서 모두 완료한다.
 */
export async function verifyProjectResources(
  projectId: string,
  userId: string,
): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // ── 1) GitHub repo 검증 ──
  const githubResource = await getProjectResourceByType(projectId, "github_repo");
  let githubGone = false;

  if (githubResource) {
    const result = await verifyGitHubRepo(githubResource, userId);
    if (result === "gone") {
      githubGone = true;
      await removeProjectResourceByType(projectId, "github_repo");
      results.push({ resourceType: "github_repo", status: "gone" });
    } else {
      results.push({ resourceType: "github_repo", status: result });
    }
  } else {
    // 리소스 없음 — orphaned substep 확인
    const substeps = await getCompletedSubstepIds(projectId, "m1-deploy");
    if (substeps.includes("m1-s2-create-repo")) {
      githubGone = true;
      results.push({ resourceType: "github_repo", status: "gone" });
    }
  }

  // GitHub repo가 삭제됐으면 관련 substep 모두 정리
  if (githubGone) {
    await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s2-create-repo");
    await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s3-git-push");
    // repo가 없으면 배포도 무효 — Vercel 리소스와 배포 substep도 함께 정리
    const vercelResource = await getProjectResourceByType(projectId, "vercel_project");
    if (vercelResource) {
      await removeProjectResourceByType(projectId, "vercel_project");
    }
    await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s5-first-deploy");
    await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s6-verify-url");
    if (!results.find((r) => r.resourceType === "vercel_project")) {
      results.push({ resourceType: "vercel_project", status: "gone" });
    }
    return results;
  }

  // ── 2) Vercel project 검증 (GitHub가 살아있을 때만) ──
  const vercelResource = await getProjectResourceByType(projectId, "vercel_project");

  if (vercelResource) {
    const result = await verifyVercelProject(vercelResource, userId);
    if (result === "gone") {
      await removeProjectResourceByType(projectId, "vercel_project");
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s5-first-deploy");
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s6-verify-url");
      results.push({ resourceType: "vercel_project", status: "gone" });
    } else {
      results.push({ resourceType: "vercel_project", status: result });
    }
  } else {
    // 리소스 없음 — orphaned substep 확인
    const substeps = await getCompletedSubstepIds(projectId, "m1-deploy");
    const hasOrphanedDeploy =
      substeps.includes("m1-s5-first-deploy") ||
      substeps.includes("m1-s6-verify-url");
    if (hasOrphanedDeploy) {
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s5-first-deploy");
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s6-verify-url");
      results.push({ resourceType: "vercel_project", status: "gone" });
    }
  }

  // ── 3) Supabase project 검증 ──
  // 사용자가 Supabase 대시보드에서 프로젝트를 직접 삭제해도 DB에는 리소스가
  // 남아 M2 substep들이 완료로 표시돼 혼란을 준다. Management API로 실제
  // 존재를 확인하고 없어지면 M2 전체(m2-s2 ~ m2-s6)와 google_oauth_keys를
  // 함께 정리한다. google_oauth_keys는 redirect URI가 기존 supabase ref에
  // 묶여 있어 새 프로젝트에서 재사용 불가 — 함께 지워 사용자가 m2-s3에서
  // 새 redirect URI를 다시 확인하도록 유도한다.
  const supabaseResource = await getProjectResourceByType(projectId, "supabase_project");

  async function cascadeSupabaseCleanup(): Promise<void> {
    await removeProjectResourceByType(projectId, "google_oauth_keys");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s2-create-supabase-project");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s3-google-oauth-keys");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s4-enable-google-provider");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s5-install-auth-ui");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s6-verify-signup");
  }

  if (supabaseResource) {
    const result = await verifySupabaseProject(supabaseResource, userId);
    if (result === "gone") {
      await removeProjectResourceByType(projectId, "supabase_project");
      await cascadeSupabaseCleanup();
      results.push({ resourceType: "supabase_project", status: "gone" });
    } else {
      results.push({ resourceType: "supabase_project", status: result });
    }
  } else {
    // 리소스 없음 — orphaned M2 substep 확인
    const substeps = await getCompletedSubstepIds(projectId, "m2-google-auth");
    const hasOrphanedSupabase =
      substeps.includes("m2-s2-create-supabase-project") ||
      substeps.includes("m2-s3-google-oauth-keys") ||
      substeps.includes("m2-s4-enable-google-provider") ||
      substeps.includes("m2-s5-install-auth-ui") ||
      substeps.includes("m2-s6-verify-signup");
    if (hasOrphanedSupabase) {
      await cascadeSupabaseCleanup();
      results.push({ resourceType: "supabase_project", status: "gone" });
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

async function verifySupabaseProject(
  resource: StoredProjectResource,
  userId: string,
): Promise<"valid" | "gone" | "skipped"> {
  try {
    const token = await getOAuthAccessToken(userId, "supabase_mgmt");
    if (!token) return "skipped";

    // createSupabaseProjectAction은 metadata.ref에 Supabase project ref를
    // 저장한다. externalId는 project id(동일 값이지만 문서상 분리).
    const meta = resource.metadata as { ref?: unknown };
    const ref =
      typeof meta.ref === "string" && meta.ref.length > 0
        ? meta.ref
        : resource.externalId;
    if (!ref) return "skipped";

    const project = await getSupabaseProject(token, ref);
    return project ? "valid" : "gone";
  } catch {
    return "skipped";
  }
}
