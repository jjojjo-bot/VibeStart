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
import {
  getSupabaseProject,
  listSupabaseProjects,
} from "@/lib/adapters/supabase-mgmt/supabase-mgmt-adapter";
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
  // ── 0) 선행 DB 조회 (3개 리소스 + M1/M2 substep 목록) 병렬 실행 ──
  // 외부 API 검증 3개를 병렬로 돌리기 전에 필요한 DB 조회를 먼저 한 번에 해둔다.
  const [
    githubResource,
    vercelResource,
    supabaseResource,
    m1Substeps,
    m2Substeps,
  ] = await Promise.all([
    getProjectResourceByType(projectId, "github_repo"),
    getProjectResourceByType(projectId, "vercel_project"),
    getProjectResourceByType(projectId, "supabase_project"),
    getCompletedSubstepIds(projectId, "m1-deploy"),
    getCompletedSubstepIds(projectId, "m2-google-auth"),
  ]);

  // ── 1) 외부 API 검증 3개 병렬 실행 ──
  // 기존에는 GitHub → Vercel → Supabase 순차 호출로 각각 0.5~2초씩 쌓여
  // 2~6초 블로킹이었다. 병렬화하면 가장 느린 한 개의 지연만 발생한다.
  // GitHub이 gone일 때 Vercel 검증이 낭비되지만 드문 edge case로 수용.
  const [githubStatus, vercelStatus, supabaseStatus] = await Promise.all([
    githubResource
      ? verifyGitHubRepo(githubResource, userId)
      : Promise.resolve<"valid" | "gone" | "skipped" | "absent">("absent"),
    vercelResource
      ? verifyVercelProject(vercelResource, userId)
      : Promise.resolve<"valid" | "gone" | "skipped" | "absent">("absent"),
    supabaseResource
      ? verifySupabaseProject(supabaseResource, userId)
      : Promise.resolve<"valid" | "gone" | "skipped" | "absent">("absent"),
  ]);

  const results: VerificationResult[] = [];

  // ── 2) GitHub 정리 (cascade 전파) ──
  let githubGone = false;
  if (githubResource) {
    if (githubStatus === "gone") {
      githubGone = true;
      await removeProjectResourceByType(projectId, "github_repo");
      results.push({ resourceType: "github_repo", status: "gone" });
    } else if (githubStatus !== "absent") {
      results.push({ resourceType: "github_repo", status: githubStatus });
    }
  } else if (m1Substeps.includes("m1-s2-create-repo")) {
    githubGone = true;
    results.push({ resourceType: "github_repo", status: "gone" });
  }

  if (githubGone) {
    await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s2-create-repo");
    await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s3-git-push");
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

  // ── 3) Vercel 정리 ──
  if (vercelResource) {
    if (vercelStatus === "gone") {
      await removeProjectResourceByType(projectId, "vercel_project");
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s5-first-deploy");
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s6-verify-url");
      results.push({ resourceType: "vercel_project", status: "gone" });
    } else if (vercelStatus !== "absent") {
      results.push({ resourceType: "vercel_project", status: vercelStatus });
    }
  } else {
    const hasOrphanedDeploy =
      m1Substeps.includes("m1-s5-first-deploy") ||
      m1Substeps.includes("m1-s6-verify-url");
    if (hasOrphanedDeploy) {
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s5-first-deploy");
      await unmarkSubstepCompleted(projectId, "m1-deploy", "m1-s6-verify-url");
      results.push({ resourceType: "vercel_project", status: "gone" });
    }
  }

  // ── 4) Supabase 정리 ──
  // 사용자가 Supabase 대시보드에서 프로젝트를 직접 삭제해도 DB에는 리소스가
  // 남아 M2 substep들이 완료로 표시돼 혼란을 준다. 삭제 감지 시 M2 전체와
  // google_oauth_keys까지 함께 정리한다. google_oauth_keys는 redirect URI가
  // 기존 supabase ref에 묶여 있어 새 프로젝트에서 재사용 불가 — 함께 지워
  // 사용자가 m2-s3에서 새 redirect URI를 다시 확인하도록 유도한다.
  async function cascadeSupabaseCleanup(): Promise<void> {
    await removeProjectResourceByType(projectId, "google_oauth_keys");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s2-create-supabase-project");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s3-google-oauth-keys");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s4-enable-google-provider");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s5-install-auth-ui");
    await unmarkSubstepCompleted(projectId, "m2-google-auth", "m2-s6-verify-signup");
  }

  if (supabaseResource) {
    if (supabaseStatus === "gone") {
      await removeProjectResourceByType(projectId, "supabase_project");
      await cascadeSupabaseCleanup();
      results.push({ resourceType: "supabase_project", status: "gone" });
    } else if (supabaseStatus !== "absent") {
      results.push({ resourceType: "supabase_project", status: supabaseStatus });
    }
  } else {
    const hasOrphanedSupabase =
      m2Substeps.includes("m2-s2-create-supabase-project") ||
      m2Substeps.includes("m2-s3-google-oauth-keys") ||
      m2Substeps.includes("m2-s4-enable-google-provider") ||
      m2Substeps.includes("m2-s5-install-auth-ui") ||
      m2Substeps.includes("m2-s6-verify-signup");
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

// Supabase 프로젝트 상태 — Management API가 반환하는 status 값.
// - ACTIVE_HEALTHY / COMING_UP / INIT_FAILED / PAUSED / RESTORING / UPGRADING
//   → 사용자가 되살릴 수 있으므로 "valid"로 처리
// - GOING_DOWN / REMOVED / INACTIVE
//   → 사용자가 대시보드에서 삭제한 직후. "gone"으로 처리.
const SUPABASE_DEAD_STATUSES = new Set(["GOING_DOWN", "REMOVED", "INACTIVE"]);

/**
 * Supabase 프로젝트 존재 검증.
 *
 * 권위 있는 소스는 list 엔드포인트(`GET /v1/projects`). 삭제된 프로젝트는
 * 리스트에 나타나지 않는다. 리스트 조회가 실패하거나(네트워크/권한 등)
 * transitional한 이유로 어긋날 경우에 대비해 per-project GET을 fallback으로
 * 시도한다. 둘 다 실패하면 "skipped"로 보수적으로 처리해 사용자의 완료
 * 상태를 건드리지 않는다.
 */
async function verifySupabaseProject(
  resource: StoredProjectResource,
  userId: string,
): Promise<"valid" | "gone" | "skipped"> {
  const token = await getOAuthAccessToken(userId, "supabase_mgmt");
  if (!token) {
    console.warn("[verifySupabaseProject] no supabase_mgmt token, skipping");
    return "skipped";
  }

  // createSupabaseProjectAction은 metadata.ref에 Supabase project ref를,
  // externalId에 project id를 저장한다.
  const meta = resource.metadata as { ref?: unknown };
  const ref =
    typeof meta.ref === "string" && meta.ref.length > 0
      ? meta.ref
      : resource.externalId;
  if (!ref) return "skipped";

  // 1차: list 엔드포인트로 권위 있는 존재 여부 판정
  try {
    const projects = await listSupabaseProjects(token);
    const found = projects.find(
      (p) => p.ref === ref || p.id === resource.externalId,
    );
    if (!found) {
      console.log("[verifySupabaseProject] not in list → gone", {
        ref,
        listedCount: projects.length,
      });
      return "gone";
    }
    if (SUPABASE_DEAD_STATUSES.has(found.status)) {
      console.log("[verifySupabaseProject] dead status → gone", {
        ref,
        status: found.status,
      });
      return "gone";
    }
    return "valid";
  } catch (listErr) {
    console.warn("[verifySupabaseProject] list failed, falling back to GET", {
      error: listErr instanceof Error ? listErr.message : String(listErr),
    });
  }

  // 2차 fallback: per-project GET
  try {
    const project = await getSupabaseProject(token, ref);
    if (project === null) {
      console.log("[verifySupabaseProject] GET 404 → gone", { ref });
      return "gone";
    }
    if (SUPABASE_DEAD_STATUSES.has(project.status)) {
      console.log("[verifySupabaseProject] GET dead status → gone", {
        ref,
        status: project.status,
      });
      return "gone";
    }
    return "valid";
  } catch (getErr) {
    console.error("[verifySupabaseProject] GET fallback also failed", {
      error: getErr instanceof Error ? getErr.message : String(getErr),
    });
    return "skipped";
  }
}
