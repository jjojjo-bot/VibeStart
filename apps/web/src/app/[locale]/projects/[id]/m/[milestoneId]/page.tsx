export const dynamic = "force-dynamic";

/**
 * /projects/[id]/m/[milestoneId] — 마일스톤 실행 화면.
 *
 * 와이어프레임(project_phase2_design.md M1~M5)과 일치하는 레이아웃:
 *   - 헤더: 트랙 뱃지 + 마일스톤 인덱스 + 제목 + 결과물 문구 + Extension 상태
 *   - 본문: SubstepList (좌) + ResultPreview (우)
 *   - 하단: MCP 자동 설치 안내 + 다음 마일스톤 CTA
 *
 * i18n 해석은 모두 서버에서 수행해 SubstepList(Client)에 문자열로 전달한다
 * (함수 props는 직렬화 불가).
 */

import { notFound, redirect as redirectRaw } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  CreateRepoPanel,
  type CreateRepoPanelState,
  CreateSupabaseProjectPanel,
  type CreateSupabaseProjectPanelState,
  DeployPanel,
  type DeployPanelState,
  type DisplaySubstep,
  EnableGoogleProviderPanel,
  type EnableGoogleProviderPanelState,
  ExtensionStatus,
  GoogleOAuthKeysPanel,
  type GoogleOAuthKeysPanelState,
  InstallAuthUiPanel,
  type InstallAuthUiPanelState,
  ResultPreview,
  SubstepList,
  TrackBadge,
  VibeCodingPanel,
} from "@/components/milestone";
import { MaybeCompletedSubstepsProvider } from "@/components/milestone/maybe-completed-provider";
import { MilestoneCelebration } from "@/components/milestone/milestone-celebration";
import {
  OAuthConnectionPanel,
  type OAuthConnectionRow,
} from "@/components/milestone/oauth-connection-panel";
import { GitPushPanel } from "@/components/milestone/git-push-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchGitHubRepoIfExists } from "@/lib/adapters/github/github-adapter";
import {
  getOAuthAccessToken,
  getOAuthConnection,
} from "@/lib/auth/oauth-connections";
import {
  addProjectResource,
  getCompletedSubstepIds,
  getProject,
  getProjectProgress,
  getProjectResourceByType,
  markSubstepCompleted,
} from "@/lib/projects/project-store";
import {
  SUPPORTED_PROVIDERS,
  providerFromSubstepId,
  providerLabel,
} from "@/lib/projects/substep-provider";
import { verifyProjectResources } from "@/lib/projects/verify-resources";

interface MilestoneRunPageProps {
  params: Promise<{ locale: string; id: string; milestoneId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * `?create_repo_error=...` 쿼리 파라미터를 사용자 친화 메시지로 매핑.
 * github-adapter.ts와 actions.ts가 던지는 에러 코드(github:name_exists 등)
 * 와 server action이 직접 추가하는 코드(no_token)를 모두 처리한다.
 */
function resolveCreateRepoError(
  raw: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (raw.includes("name_exists")) return t("errorNameExists");
  if (raw.includes("no_token")) return t("errorNoToken");
  if (raw.includes("unauthorized")) return t("errorUnauthorized");
  if (raw.includes("forbidden")) return t("errorForbidden");
  return t("errorGeneric", { code: raw });
}

/**
 * `?vercel_error=...` 쿼리 파라미터를 사용자 친화 메시지로 매핑.
 * vercel-adapter.ts의 에러 코드와 connectVercelAction의 missing_token 처리.
 */
function resolveVercelError(
  raw: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (raw.includes("missing_token")) return t("vercelErrorMissingToken");
  if (raw.includes("invalid_token")) return t("vercelErrorInvalidToken");
  if (raw.includes("forbidden")) return t("vercelErrorForbidden");
  if (raw.includes("service_unavailable"))
    return t("vercelErrorServiceUnavailable");
  return t("vercelErrorGeneric", { code: raw });
}

function resolveDeployError(
  raw: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (raw.includes("no_repo")) return t("errorNoRepo");
  if (raw.includes("no_github_token")) return t("errorNoGithubToken");
  if (raw.includes("no_vercel_token")) return t("errorNoVercelToken");
  if (raw.includes("plan_limit")) return t("errorPlanLimit");
  if (raw.includes("github_app_not_installed"))
    return t("errorGithubAppNotInstalled");
  if (raw.includes("timeout")) return t("errorTimeout");
  return t("errorGeneric", { code: raw });
}

function resolveSupabaseProjectError(
  raw: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (raw.includes("no_token")) return t("errorNoToken");
  if (raw.includes("no_organization")) return t("errorNoOrganization");
  if (raw.includes("plan_limit")) return t("errorPlanLimit");
  if (raw.includes("invalid_token")) return t("errorInvalidToken");
  if (raw.includes("init_failed")) return t("errorInitFailed");
  return t("errorGeneric", { code: raw });
}

function resolveGoogleKeysError(
  raw: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (raw.includes("empty")) return t("errorEmpty");
  if (raw.includes("too_long")) return t("errorTooLong");
  return t("errorGeneric", { code: raw });
}

function resolveGoogleProviderError(
  raw: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (raw.includes("no_supabase_project") || raw.includes("no_supabase_ref"))
    return t("errorNoSupabaseProject");
  if (raw.includes("no_google_keys") || raw.includes("invalid_google_keys"))
    return t("errorNoGoogleKeys");
  if (raw.includes("no_token")) return t("errorNoToken");
  if (raw.includes("invalid_token")) return t("errorInvalidToken");
  if (raw.includes("forbidden")) return t("errorForbidden");
  if (raw.includes("project_not_found")) return t("errorProjectNotFound");
  if (raw.includes("rate_limited")) return t("errorRateLimited");
  return t("errorGeneric", { code: raw });
}

function resolveInstallAuthUiError(
  raw: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (raw.includes("no_repo")) return t("errorNoRepo");
  if (raw.includes("no_supabase_project") || raw.includes("no_supabase_ref"))
    return t("errorNoSupabaseProject");
  if (raw.includes("no_vercel_project") || raw.includes("no_vercel_url"))
    return t("errorNoVercelProject");
  if (raw.includes("no_github_token")) return t("errorNoGithubToken");
  if (raw.includes("no_supabase_token")) return t("errorNoSupabaseToken");
  if (raw.includes("invalid_repo")) return t("errorInvalidRepo");
  if (raw.includes("fetch_key_failed")) return t("errorFetchKeyFailed");
  if (raw.includes("site_config_failed")) return t("errorSiteConfigFailed");
  if (raw.includes("push_failed")) return t("errorPushFailed");
  if (raw.includes("deploy_failed")) return t("errorDeployFailed");
  return t("errorGeneric", { code: raw });
}

export default async function MilestoneRunPage({
  params,
  searchParams,
}: MilestoneRunPageProps): Promise<React.ReactNode> {
  const { locale, id, milestoneId } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const project = await getProject(id);
  if (!project || project.userId !== user.id) {
    notFound();
  }

  // 외부 리소스 존재 여부 검증 — 삭제된 리소스는 DB에서 자동 정리.
  //
  // Cleanup이 발생했는데 URL에 ?resources_cleaned 플래그가 없으면, 같은 경로
  // 로 redirect해 새 render tree에서 데이터를 다시 읽는다. Next.js 16의
  // Request Memoization은 render tree 생명주기 동안 동일 URL GET 응답을
  // 재사용하는데, cleanup 이전에 verifyProjectResources 내부에서 이미 읽힌
  // `project_resources` GET 결과가 cleanup 후 page가 재조회할 때 stale하게
  // 돌아오는 문제가 있어 `cache: 'no-store'`만으로는 회피되지 않았다.
  // redirect는 요청을 새로 만들어 render tree가 완전히 초기화되므로 가장
  // 확실한 해법.
  //
  // 2차 render는 query.resources_cleaned를 읽어 "삭제됨" 배너만 유지하고
  // verifyProjectResources는 cleanup이 이미 반영된 DB 상태를 확인하므로
  // 더 이상 redirect하지 않아 무한 루프가 없다.
  const verificationResults = await verifyProjectResources(project.id, user.id);
  const freshlyRemoved = verificationResults
    .filter((r) => r.status === "gone")
    .map((r) => r.resourceType);

  const alreadyCleanedRaw = query.resources_cleaned;
  if (freshlyRemoved.length > 0 && typeof alreadyCleanedRaw !== "string") {
    const cleanedParam = encodeURIComponent(freshlyRemoved.join(","));
    const prefix = locale === "ko" ? "" : `/${locale}`;
    redirectRaw(
      `${prefix}/projects/${id}/m/${milestoneId}?resources_cleaned=${cleanedParam}`,
    );
  }

  // 배너 표시용: 이번 render에서 삭제된 것 + 직전 redirect에서 전달된 것
  const removedResources =
    freshlyRemoved.length > 0
      ? freshlyRemoved
      : typeof alreadyCleanedRaw === "string"
        ? alreadyCleanedRaw.split(",").filter(Boolean)
        : [];

  const catalog = createInMemoryMilestoneCatalog();
  const track = catalog.getTrack(project.track);
  const milestone = catalog.getMilestone(project.track, milestoneId);
  if (!track || !milestone) {
    notFound();
  }

  const allMilestones = catalog.listMilestones(project.track);
  const total = allMilestones.length;
  const order = milestone.order;

  const progress = await getProjectProgress(
    project.id,
    allMilestones.map((m) => m.id),
  );
  let currentState = progress[milestone.id] ?? "locked";
  const storedCompletedSubsteps = await getCompletedSubstepIds(
    project.id,
    milestone.id,
  );

  const tRun = await getTranslations("MilestoneRun");
  const tMilestones = await getTranslations("Milestones");
  const tProjects = await getTranslations("Projects");
  const tConnections = await getTranslations("Connections");
  const tCreateRepo = await getTranslations("CreateRepo");
  const tGitPush = await getTranslations("GitPush");
  const tDeploy = await getTranslations("FirstDeploy");
  const tCreateSupabase = await getTranslations("CreateSupabaseProject");
  const tGoogleKeys = await getTranslations("GoogleOAuthKeys");
  const tEnableGoogle = await getTranslations("EnableGoogleProvider");
  const tInstallAuthUi = await getTranslations("InstallAuthUi");
  const tVibeCoding = await getTranslations("VibeCoding");

  // OAuth 연결 패널 데이터 — 이 마일스톤의 oauth kind 서브스텝을 모아
  // provider별 연결 상태를 조회한다. connectedLabel은 next-intl이 호출
  // 시점에 placeholder 값을 요구하므로 row 루프에서 해석한다.
  const oauthSubsteps = milestone.substeps.filter((s) => s.kind === "oauth");
  const connectionRows: OAuthConnectionRow[] = [];
  for (const step of oauthSubsteps) {
    const provider = providerFromSubstepId(step.id);
    if (!provider) continue;
    const supported = SUPPORTED_PROVIDERS.has(provider);
    let connected = false;
    let username: string | null = null;
    if (supported) {
      const conn = await getOAuthConnection(user.id, provider);
      connected = conn !== null;
      username = conn?.providerUsername ?? null;
    }
    connectionRows.push({
      substepId: step.id,
      provider,
      providerLabel: providerLabel(provider),
      connected,
      connectedLabel:
        connected && username
          ? tConnections("connectedAs", { username })
          : null,
      supported,
    });
  }

  // GitPushPanel용 GitHub username 추출
  const githubConn = await getOAuthConnection(user.id, "github");
  const githubUsernameForPush = githubConn?.providerUsername ?? null;

  // OAuth 연결은 Supabase에 영구 저장되지만 substep 완료 상태는 (Phase 2a
  // 한정) in-memory store에만 있어서 dev 서버 재시작 시 사라진다. 사용자가
  // 같은 작업을 다시 하지 않아도 되도록, 연결이 살아있는 OAuth substep은
  // 자동으로 완료된 것으로 간주한다. Phase 2b에서 substep 완료 상태가 DB로
  // 옮겨가면 이 derive 로직은 제거.
  const derivedCompletedFromOauth = connectionRows
    .filter((r) => r.connected)
    .map((r) => r.substepId);

  // m1-s2-create-repo recovery: in-memory project_resources는 dev 재시작 시
  // 비워지지만 GitHub.com에는 실제 repo가 살아있다. GitHub OAuth가 연결돼
  // 있으면 GitHub API로 `<username>/<slug>` 저장소 존재 여부를 확인하고,
  // 있으면 in-memory에 다시 등록한다. Phase 2b 이후 불필요.
  const createRepoSubstep = milestone.substeps.find(
    (s) => s.id === "m1-s2-create-repo",
  );
  let existingRepo = removedResources.includes("github_repo")
    ? null
    : await getProjectResourceByType(project.id, "github_repo");
  if (createRepoSubstep && !existingRepo && !removedResources.includes("github_repo")) {
    const githubRow = connectionRows.find((r) => r.provider === "github");
    if (githubRow?.connected) {
      try {
        const githubConn = await getOAuthConnection(user.id, "github");
        const githubToken = await getOAuthAccessToken(user.id, "github");
        if (githubConn?.providerUsername && githubToken) {
          const repo = await fetchGitHubRepoIfExists(
            githubToken,
            githubConn.providerUsername,
            project.slug,
          );
          if (repo) {
            existingRepo = await addProjectResource({
              projectId: project.id,
              provider: "github",
              resourceType: "github_repo",
              externalId: repo.fullName,
              url: repo.htmlUrl,
              metadata: {
                repoId: repo.id,
                defaultBranch: repo.defaultBranch,
                cloneUrl: repo.cloneUrl,
                isPrivate: repo.isPrivate,
              },
            });
          }
        }
      } catch (err) {
        console.error("[milestone page] github repo recovery failed", {
          projectId: project.id,
          error: err instanceof Error ? err.message : String(err),
        });
        // recovery 실패해도 사용자는 여전히 "저장소 생성" 버튼으로 재시도 가능
      }
    }
  }

  // project_resources에서 derive: github_repo가 있으면 m1-s2 완료로 간주.
  const derivedCompletedFromResources: string[] = [];
  if (existingRepo && createRepoSubstep) {
    derivedCompletedFromResources.push(createRepoSubstep.id);
  }

  // verify에서 삭제된 리소스 관련 substep은 완료 목록에서 제외
  const removedSubstepIds = new Set<string>();
  if (removedResources.includes("github_repo")) {
    removedSubstepIds.add("m1-s2-create-repo");
  }
  if (removedResources.includes("vercel_project")) {
    removedSubstepIds.add("m1-s5-first-deploy");
    removedSubstepIds.add("m1-s6-verify-url");
  }

  const initialCompletedSubsteps = Array.from(
    new Set([
      ...storedCompletedSubsteps,
      ...derivedCompletedFromOauth,
      ...derivedCompletedFromResources,
    ]),
  ).filter((id) => !removedSubstepIds.has(id));

  // 성공/에러 토스트 메시지. github와 vercel 두 provider가 같은 패널을
  // 공유하므로 둘 다 처리. 동시 발생은 거의 없지만 vercel을 우선으로 표시.
  const githubConnected = query.github_connected === "1";
  const vercelConnected = query.vercel_connected === "1";
  const supabaseConnected = query.supabase_connected === "1";
  const oauthError =
    typeof query.oauth_error === "string" ? query.oauth_error : null;
  const vercelError =
    typeof query.vercel_error === "string" ? query.vercel_error : null;

  // Substep 카탈로그 순서에 맞춰 OAuth 패널을 provider별로 분리해 렌더.
  // 각 패널은 자기 provider 토스트만 표시.
  // - M1: github → vercel
  // - M2: supabase_mgmt
  const githubRows = connectionRows.filter((r) => r.provider === "github");
  const vercelRows = connectionRows.filter((r) => r.provider === "vercel");
  const supabaseRows = connectionRows.filter(
    (r) => r.provider === "supabase_mgmt",
  );

  const baseConnectionLabels = {
    connectButton: tConnections("connectButton"),
    connecting: tConnections("connecting"),
    reconnectButton: tConnections("reconnectButton"),
    comingSoon: tConnections("comingSoon"),
    vercelHelperText: tConnections("vercelHelperText"),
    vercelHelperLink: tConnections("vercelHelperLink"),
    vercelTokenPlaceholder: tConnections("vercelTokenPlaceholder"),
    vercelConnectButton: tConnections("vercelConnectButton"),
    signupGuideGithub: tConnections("signupGuideGithub"),
    signupGuideVercel: tConnections("signupGuideVercel"),
    signupGuideSupabase: tConnections("signupGuideSupabase"),
  };

  const supabasePanelLabels = {
    ...baseConnectionLabels,
    title: null,
    successMessage: supabaseConnected ? tConnections("successSupabase") : null,
    errorMessage: oauthError
      ? tConnections("errorGeneric", { code: oauthError })
      : null,
  };

  const githubPanelLabels = {
    ...baseConnectionLabels,
    title: null,
    successMessage: githubConnected ? tConnections("successGithub") : null,
    errorMessage: oauthError
      ? tConnections("errorGeneric", { code: oauthError })
      : null,
  };

  const vercelPanelLabels = {
    ...baseConnectionLabels,
    title: null,
    successMessage: vercelConnected ? tConnections("successVercel") : null,
    errorMessage: vercelError
      ? resolveVercelError(vercelError, tConnections)
      : null,
  };

  // CreateRepoPanel — m1-deploy 마일스톤에서만 표시.
  // 다른 트랙/마일스톤에 동일 패턴이 더 필요해지면 그때 추상화한다.
  // createRepoSubstep / existingRepo는 위쪽 recovery 블록에서 이미 계산됨.
  let createRepoPanelData: {
    state: CreateRepoPanelState;
    existingRepoUrl: string | null;
    labels: {
      title: string;
      creating: string;
      description: string;
      ctaCreateRepo: string;
      waitingOauth: string;
      createdSuccess: string | null;
      alreadyExists: string | null;
      openOnGithub: string;
      errorMessage: string | null;
    };
  } | null = null;

  if (createRepoSubstep) {
    const githubRow = connectionRows.find((r) => r.provider === "github");
    const githubLinked = githubRow?.connected ?? false;
    const createRepoDone = initialCompletedSubsteps.includes(
      createRepoSubstep.id,
    );

    let state: CreateRepoPanelState;
    if (createRepoDone || existingRepo) {
      state = "created";
    } else if (githubLinked) {
      state = "ready";
    } else {
      state = "needs-oauth";
    }

    const repoCreatedFlag =
      query.repo_created === "1" ? "fresh" : query.repo_created === "already" ? "already" : null;
    const createRepoErrorRaw =
      typeof query.create_repo_error === "string"
        ? query.create_repo_error
        : null;

    createRepoPanelData = {
      state,
      existingRepoUrl: existingRepo?.url ?? null,
      labels: {
        title: tCreateRepo("title"),
        creating: tCreateRepo("creating"),
        description: tCreateRepo("description"),
        ctaCreateRepo: tCreateRepo("ctaCreateRepo"),
        waitingOauth: tCreateRepo("waitingOauth"),
        createdSuccess:
          repoCreatedFlag === "fresh" ? tCreateRepo("createdSuccess") : null,
        alreadyExists:
          repoCreatedFlag === "already" ? tCreateRepo("alreadyExists") : null,
        openOnGithub: tCreateRepo("openOnGithub"),
        errorMessage: createRepoErrorRaw
          ? resolveCreateRepoError(createRepoErrorRaw, tCreateRepo)
          : null,
      },
    };
  }

  // DeployPanel — m1-s5-first-deploy. 선행: github_repo + vercel 연결.
  const deploySubstep = milestone.substeps.find(
    (s) => s.id === "m1-s5-first-deploy",
  );
  // verify에서 삭제된 리소스는 강제로 null 처리
  const existingVercelProject = removedResources.includes("vercel_project")
    ? null
    : await getProjectResourceByType(project.id, "vercel_project");
  let deployPanelData: {
    state: DeployPanelState;
    deployedUrl: string | null;
    labels: {
      title: string;
      description: string;
      ctaDeploy: string;
      deploying: string;
      waitingRepo: string;
      waitingVercel: string;
      deployedSuccess: string | null;
      alreadyDeployed: string | null;
      deployingMessage: string | null;
      openSite: string;
      errorMessage: string | null;
    };
  } | null = null;

  if (deploySubstep) {
    const vercelRow = connectionRows.find((r) => r.provider === "vercel");
    const vercelLinked = vercelRow?.connected ?? false;
    const deployDone =
      initialCompletedSubsteps.includes(deploySubstep.id) ||
      !!existingVercelProject;

    let deployState: DeployPanelState;
    if (deployDone) {
      deployState = "deployed";
    } else if (!existingRepo) {
      deployState = "needs-repo";
    } else if (!vercelLinked) {
      deployState = "needs-vercel";
    } else {
      deployState = "ready";
    }

    const deployCreatedFlag =
      query.deploy_created === "1"
        ? "fresh"
        : query.deploy_created === "already"
          ? "already"
          : query.deploy_created === "timeout"
            ? "timeout"
            : null;
    const deployErrorRaw =
      typeof query.deploy_error === "string" ? query.deploy_error : null;

    deployPanelData = {
      state: deployState,
      deployedUrl: existingVercelProject?.url ?? null,
      labels: {
        title: tDeploy("title"),
        description: tDeploy("description"),
        ctaDeploy: tDeploy("ctaDeploy"),
        deploying: tDeploy("deploying"),
        waitingRepo: tDeploy("waitingRepo"),
        waitingVercel: tDeploy("waitingVercel"),
        deployedSuccess:
          deployCreatedFlag === "fresh" ? tDeploy("deployedSuccess") : null,
        alreadyDeployed:
          deployCreatedFlag === "already" ? tDeploy("alreadyDeployed") : null,
        deployingMessage:
          deployCreatedFlag === "timeout" ? tDeploy("errorTimeout") : null,
        openSite: tDeploy("openSite"),
        errorMessage: deployErrorRaw && deployState !== "deployed"
          ? resolveDeployError(deployErrorRaw, tDeploy)
          : null,
      },
    };
  }

  // M2 (마)-2: Supabase 프로젝트 생성 패널 데이터 계산.
  const createSupabaseSubstep = milestone.substeps.find(
    (s) => s.id === "m2-s2-create-supabase-project",
  );
  const existingSupabaseProject = await getProjectResourceByType(
    project.id,
    "supabase_project",
  );

  let createSupabasePanelData: {
    state: CreateSupabaseProjectPanelState;
    dashboardUrl: string | null;
    labels: {
      title: string;
      description: string;
      ctaCreate: string;
      creating: string;
      waitingOauth: string;
      createdSuccess: string | null;
      alreadyExists: string | null;
      openDashboard: string;
      errorMessage: string | null;
    };
  } | null = null;

  if (createSupabaseSubstep) {
    const supabaseRow = connectionRows.find(
      (r) => r.provider === "supabase_mgmt",
    );
    const supabaseLinked = supabaseRow?.connected ?? false;

    let panelState: CreateSupabaseProjectPanelState;
    if (existingSupabaseProject) {
      panelState = "created";
    } else if (supabaseLinked) {
      panelState = "ready";
    } else {
      panelState = "needs-oauth";
    }

    const supabaseProjectCreatedFlag =
      query.supabase_project_created === "1"
        ? "fresh"
        : query.supabase_project_created === "already"
          ? "already"
          : null;
    const supabaseProjectErrorRaw =
      typeof query.supabase_project_error === "string"
        ? query.supabase_project_error
        : null;

    createSupabasePanelData = {
      state: panelState,
      dashboardUrl: existingSupabaseProject?.url ?? null,
      labels: {
        title: tCreateSupabase("title"),
        description: tCreateSupabase("description"),
        ctaCreate: tCreateSupabase("ctaCreate"),
        creating: tCreateSupabase("creating"),
        waitingOauth: tCreateSupabase("waitingOauth"),
        createdSuccess:
          supabaseProjectCreatedFlag === "fresh"
            ? tCreateSupabase("createdSuccess")
            : null,
        alreadyExists:
          supabaseProjectCreatedFlag === "already"
            ? tCreateSupabase("alreadyExists")
            : null,
        openDashboard: tCreateSupabase("openDashboard"),
        errorMessage: supabaseProjectErrorRaw
          ? resolveSupabaseProjectError(
              supabaseProjectErrorRaw,
              tCreateSupabase,
            )
          : null,
      },
    };
  }

  // supabase_project 존재 시 m2-s2를 derive에 추가.
  if (existingSupabaseProject && createSupabaseSubstep) {
    if (!initialCompletedSubsteps.includes(createSupabaseSubstep.id)) {
      initialCompletedSubsteps.push(createSupabaseSubstep.id);
    }
  }

  // M2 (마)-3: Google OAuth 키 수집 패널 데이터.
  const googleKeysSubstep = milestone.substeps.find(
    (s) => s.id === "m2-s3-google-oauth-keys",
  );
  const existingGoogleKeys = await getProjectResourceByType(
    project.id,
    "google_oauth_keys",
  );

  // Supabase 프로젝트 metadata에서 ref를 꺼내 redirect URI 계산.
  // existingSupabaseProject.metadata.ref는 (마)-2에서 저장한 값.
  const supabaseRef =
    existingSupabaseProject &&
    typeof existingSupabaseProject.metadata === "object" &&
    existingSupabaseProject.metadata !== null &&
    "ref" in existingSupabaseProject.metadata &&
    typeof (existingSupabaseProject.metadata as { ref?: unknown }).ref ===
      "string"
      ? ((existingSupabaseProject.metadata as { ref: string }).ref as string)
      : null;

  const googleRedirectUri = supabaseRef
    ? `https://${supabaseRef}.supabase.co/auth/v1/callback`
    : null;

  let googleKeysPanelData: {
    state: GoogleOAuthKeysPanelState;
    redirectUri: string | null;
    externalUrl: string;
    savedClientIdMasked: string | null;
    labels: {
      title: string;
      description: string;
      waitingSupabase: string;
      step1Label: string;
      externalLinkCta: string;
      step1Details?: string[];
      step2Label: string;
      redirectUriLabel: string;
      redirectUriHelp: string;
      copyButton: string;
      copiedLabel: string;
      step3Label: string;
      clientIdLabel: string;
      clientIdPlaceholder: string;
      clientSecretLabel: string;
      clientSecretPlaceholder: string;
      ctaSave: string;
      saving: string;
      savedSuccess: string | null;
      alreadySaved: string | null;
      errorMessage: string | null;
      noticeMessage: string | null;
      savedClientIdLabel: string;
      editButton: string;
      resetting: string;
    };
  } | null = null;

  if (googleKeysSubstep) {
    let keysState: GoogleOAuthKeysPanelState;
    if (existingGoogleKeys) {
      keysState = "saved";
    } else if (existingSupabaseProject) {
      keysState = "ready";
    } else {
      keysState = "waiting-supabase";
    }

    // 마스킹된 clientId 생성: 앞 12자 + '****' + 뒤 25자 (google usercontent 도메인 보존)
    // 예: "000000000000-xxxx****.apps.googleusercontent.com"
    let savedClientIdMasked: string | null = null;
    if (existingGoogleKeys) {
      const rawClientId =
        typeof existingGoogleKeys.metadata === "object" &&
        existingGoogleKeys.metadata !== null &&
        "clientId" in existingGoogleKeys.metadata &&
        typeof (existingGoogleKeys.metadata as { clientId?: unknown })
          .clientId === "string"
          ? ((existingGoogleKeys.metadata as { clientId: string }).clientId)
          : null;
      if (rawClientId) {
        if (rawClientId.length <= 16) {
          savedClientIdMasked = "••••";
        } else {
          const head = rawClientId.slice(0, 12);
          const tail = rawClientId.slice(-25);
          savedClientIdMasked = `${head}••••${tail}`;
        }
      }
    }

    const googleKeysSavedFlag =
      query.google_keys_saved === "1"
        ? "fresh"
        : query.google_keys_saved === "already"
          ? "already"
          : null;
    const googleKeysResetFlag = query.google_keys_reset === "1";
    const googleKeysErrorRaw =
      typeof query.google_keys_error === "string"
        ? query.google_keys_error
        : null;

    googleKeysPanelData = {
      state: keysState,
      redirectUri: googleRedirectUri,
      externalUrl:
        googleKeysSubstep.externalUrl ??
        "https://console.cloud.google.com/apis/credentials",
      savedClientIdMasked,
      labels: {
        title: tGoogleKeys("title"),
        description: tGoogleKeys("description"),
        waitingSupabase: tGoogleKeys("waitingSupabase"),
        step1Label: tGoogleKeys("step1Label"),
        externalLinkCta: tGoogleKeys("externalLinkCta"),
        step1Details: [
          tGoogleKeys("step1Detail1"),
          tGoogleKeys("step1Detail2"),
          tGoogleKeys("step1Detail3"),
          tGoogleKeys("step1Detail4"),
          tGoogleKeys("step1Detail5"),
          tGoogleKeys("step1Detail6"),
          tGoogleKeys("step1Detail7"),
        ],
        step2Label: tGoogleKeys("step2Label"),
        redirectUriLabel: tGoogleKeys("redirectUriLabel"),
        redirectUriHelp: tGoogleKeys("redirectUriHelp"),
        copyButton: tGoogleKeys("copyButton"),
        copiedLabel: tGoogleKeys("copiedLabel"),
        step3Label: tGoogleKeys("step3Label"),
        clientIdLabel: tGoogleKeys("clientIdLabel"),
        clientIdPlaceholder: tGoogleKeys("clientIdPlaceholder"),
        clientSecretLabel: tGoogleKeys("clientSecretLabel"),
        clientSecretPlaceholder: tGoogleKeys("clientSecretPlaceholder"),
        ctaSave: tGoogleKeys("ctaSave"),
        saving: tGoogleKeys("saving"),
        savedSuccess:
          googleKeysSavedFlag === "fresh" ? tGoogleKeys("savedSuccess") : null,
        alreadySaved:
          googleKeysSavedFlag === "already"
            ? tGoogleKeys("alreadySaved")
            : null,
        errorMessage: googleKeysErrorRaw
          ? resolveGoogleKeysError(googleKeysErrorRaw, tGoogleKeys)
          : null,
        noticeMessage: googleKeysResetFlag
          ? tGoogleKeys("resetSuccess")
          : null,
        savedClientIdLabel: tGoogleKeys("savedClientIdLabel"),
        editButton: tGoogleKeys("editButton"),
        resetting: tGoogleKeys("resetting"),
      },
    };
  }

  // google_oauth_keys 존재 시 m2-s3을 derive에 추가.
  if (existingGoogleKeys && googleKeysSubstep) {
    if (!initialCompletedSubsteps.includes(googleKeysSubstep.id)) {
      initialCompletedSubsteps.push(googleKeysSubstep.id);
    }
  }

  // M2 (마)-4: Google provider 활성화 패널 데이터.
  const enableGoogleSubstep = milestone.substeps.find(
    (s) => s.id === "m2-s4-enable-google-provider",
  );
  // supabase_project metadata.googleProviderEnabled 플래그로 (마)-4 완료 판정.
  // (마)-2에서 만든 supabase_project 리소스 metadata에 (마)-4 액션이 기록.
  const googleProviderAlreadyEnabled =
    !!existingSupabaseProject &&
    typeof existingSupabaseProject.metadata === "object" &&
    existingSupabaseProject.metadata !== null &&
    "googleProviderEnabled" in existingSupabaseProject.metadata &&
    (existingSupabaseProject.metadata as { googleProviderEnabled?: unknown })
      .googleProviderEnabled === true;

  let enableGooglePanelData: {
    state: EnableGoogleProviderPanelState;
    labels: {
      title: string;
      description: string;
      ctaEnable: string;
      enabling: string;
      waitingSupabase: string;
      waitingKeys: string;
      enabledSuccess: string | null;
      alreadyEnabled: string;
      reEnableButton: string;
      errorMessage: string | null;
    };
  } | null = null;

  if (enableGoogleSubstep) {
    let providerState: EnableGoogleProviderPanelState;
    if (googleProviderAlreadyEnabled) {
      providerState = "enabled";
    } else if (!existingSupabaseProject) {
      providerState = "needs-supabase";
    } else if (!existingGoogleKeys) {
      providerState = "needs-keys";
    } else {
      providerState = "ready";
    }

    const googleProviderEnabledFlag = query.google_provider_enabled === "1";
    const googleProviderErrorRaw =
      typeof query.google_provider_error === "string"
        ? query.google_provider_error
        : null;

    enableGooglePanelData = {
      state: providerState,
      labels: {
        title: tEnableGoogle("title"),
        description: tEnableGoogle("description"),
        ctaEnable: tEnableGoogle("ctaEnable"),
        enabling: tEnableGoogle("enabling"),
        waitingSupabase: tEnableGoogle("waitingSupabase"),
        waitingKeys: tEnableGoogle("waitingKeys"),
        enabledSuccess: googleProviderEnabledFlag
          ? tEnableGoogle("enabledSuccess")
          : null,
        alreadyEnabled: tEnableGoogle("alreadyEnabled"),
        reEnableButton: tEnableGoogle("reEnableButton"),
        errorMessage: googleProviderErrorRaw
          ? resolveGoogleProviderError(googleProviderErrorRaw, tEnableGoogle)
          : null,
      },
    };
  }

  // googleProviderEnabled 플래그 시 m2-s4를 derive에 추가.
  if (googleProviderAlreadyEnabled && enableGoogleSubstep) {
    if (!initialCompletedSubsteps.includes(enableGoogleSubstep.id)) {
      initialCompletedSubsteps.push(enableGoogleSubstep.id);
    }
  }

  // M2 (마)-5: Auth UI 설치 패널 데이터.
  const installAuthUiSubstep = milestone.substeps.find(
    (s) => s.id === "m2-s5-install-auth-ui",
  );
  const authUiAlreadyInstalled =
    !!existingSupabaseProject &&
    typeof existingSupabaseProject.metadata === "object" &&
    existingSupabaseProject.metadata !== null &&
    "authUiInstalled" in existingSupabaseProject.metadata &&
    (existingSupabaseProject.metadata as { authUiInstalled?: unknown })
      .authUiInstalled === true;

  // (마)-6 verify: (마)-5가 완료되면 자동으로 m2-s6도 완료로 처리한다.
  // firstDeployAction의 패턴과 동일.
  const verifySignupSubstep = milestone.substeps.find(
    (s) => s.id === "m2-s6-verify-signup",
  );

  let installAuthUiPanelData: {
    state: InstallAuthUiPanelState;
    deployedUrl: string | null;
    labels: {
      title: string;
      description: string;
      ctaInstall: string;
      installing: string;
      waitingProvider: string;
      installedSuccess: string | null;
      alreadyInstalled: string;
      openSite: string;
      errorMessage: string | null;
    };
  } | null = null;

  if (installAuthUiSubstep) {
    let installState: InstallAuthUiPanelState;
    if (authUiAlreadyInstalled) {
      installState = "installed";
    } else if (!googleProviderAlreadyEnabled) {
      installState = "needs-provider";
    } else {
      installState = "ready";
    }

    const authUiInstalledRaw = query.auth_ui_installed;
    const authUiInstalledFlag =
      authUiInstalledRaw === "1"
        ? "ready"
        : authUiInstalledRaw === "pending"
          ? "pending"
          : null;
    const installAuthUiErrorRaw =
      typeof query.install_auth_ui_error === "string"
        ? query.install_auth_ui_error
        : null;

    installAuthUiPanelData = {
      state: installState,
      deployedUrl: existingVercelProject?.url ?? null,
      labels: {
        title: tInstallAuthUi("title"),
        description: tInstallAuthUi("description"),
        ctaInstall: tInstallAuthUi("ctaInstall"),
        installing: tInstallAuthUi("installing"),
        waitingProvider: tInstallAuthUi("waitingProvider"),
        installedSuccess:
          authUiInstalledFlag === "ready"
            ? tInstallAuthUi("installedSuccess")
            : authUiInstalledFlag === "pending"
              ? tInstallAuthUi("installedPending")
              : null,
        alreadyInstalled: tInstallAuthUi("alreadyInstalled"),
        openSite: tInstallAuthUi("openSite"),
        errorMessage: installAuthUiErrorRaw
          ? resolveInstallAuthUiError(installAuthUiErrorRaw, tInstallAuthUi)
          : null,
      },
    };
  }

  // authUiInstalled 플래그 시 m2-s5 + m2-s6 두 개를 derive에 추가.
  if (authUiAlreadyInstalled && installAuthUiSubstep) {
    if (!initialCompletedSubsteps.includes(installAuthUiSubstep.id)) {
      initialCompletedSubsteps.push(installAuthUiSubstep.id);
    }
    if (
      verifySignupSubstep &&
      !initialCompletedSubsteps.includes(verifySignupSubstep.id)
    ) {
      initialCompletedSubsteps.push(verifySignupSubstep.id);
    }
  }

  // vercel_project 존재 시 m1-s4 + 다음 verify substep을 derive에 추가.
  if (existingVercelProject && deploySubstep) {
    if (!initialCompletedSubsteps.includes(deploySubstep.id)) {
      initialCompletedSubsteps.push(deploySubstep.id);
    }
    // 다음 substep이 verify면 자동 완료 (firstDeployAction의 동작과 동일)
    const idx = milestone.substeps.findIndex(
      (s) => s.id === deploySubstep.id,
    );
    const nextSubstep = milestone.substeps[idx + 1];
    if (
      nextSubstep &&
      nextSubstep.kind === "verify" &&
      !initialCompletedSubsteps.includes(nextSubstep.id)
    ) {
      initialCompletedSubsteps.push(nextSubstep.id);
    }
  }

  // M3 바이브코딩 패널 데이터
  let vibeCodingData: {
    deployedUrl: string | null;
    labels: {
      title: string;
      description: string;
      step1Title: string;
      step1Desc: string;
      step1VscodeMacCmd: string;
      step1VscodeWinCmd: string;
      step1ClaudeCmd: string;
      step2Title: string;
      step2Desc: string;
      step2Prompt: string;
      step3Title: string;
      step3Desc: string;
      step3Prompt: string;
      step4Title: string;
      step4Desc: string;
      step4Cta: string;
      copyButton: string;
      copiedButton: string;
      doneButton: string;
      undoButton: string;
      doneLabel: string;
    };
  } | null = null;

  if (milestone.id === "m3-vibe-coding") {
    const vercelResource = await getProjectResourceByType(project.id, "vercel_project");
    vibeCodingData = {
      deployedUrl: vercelResource?.url ?? null,
      labels: {
        title: tVibeCoding("title"),
        description: tVibeCoding("description"),
        step1Title: tVibeCoding("step1Title"),
        step1Desc: tVibeCoding("step1Desc"),
        step1VscodeMacCmd: tVibeCoding("step1VscodeMacCmd"),
        step1VscodeWinCmd: tVibeCoding("step1VscodeWinCmd"),
        step1ClaudeCmd: tVibeCoding("step1ClaudeCmd"),
        step2Title: tVibeCoding("step2Title"),
        step2Desc: tVibeCoding("step2Desc"),
        step2Prompt: tVibeCoding("step2Prompt"),
        step3Title: tVibeCoding("step3Title"),
        step3Desc: tVibeCoding("step3Desc"),
        step3Prompt: tVibeCoding("step3Prompt"),
        step4Title: tVibeCoding("step4Title"),
        step4Desc: tVibeCoding("step4Desc"),
        step4Cta: tVibeCoding("step4Cta"),
        copyButton: tVibeCoding("copyButton"),
        copiedButton: tVibeCoding("copiedButton"),
        doneButton: tVibeCoding("doneButton"),
        undoButton: tVibeCoding("undoButton"),
        doneLabel: tVibeCoding("doneLabel"),
      },
    };
  }

  // 모든 derive 결과를 store에 동기화 — OAuth/Resource derive로만 UI에 표시되던
  // substep을 retroactively store에 마킹해 milestoneState가 정상 전환되도록.
  // store가 이미 가진 substep은 markSubstepCompleted가 idempotent로 처리.
  const alreadyStored = new Set(storedCompletedSubsteps);
  let storeChanged = false;
  for (const id of initialCompletedSubsteps) {
    if (!alreadyStored.has(id)) {
      await markSubstepCompleted({
        projectId: project.id,
        milestoneId: milestone.id,
        substepId: id,
        totalSubsteps: milestone.substeps.length,
        allMilestoneIds: allMilestones.map((m) => m.id),
      });
      storeChanged = true;
    }
  }
  if (storeChanged) {
    const updatedProgress = await getProjectProgress(
      project.id,
      allMilestones.map((m) => m.id),
    );
    currentState = updatedProgress[milestone.id] ?? currentState;
  }

  // Server에서 substep 제목과 예상 시간 라벨을 미리 해석해 Client 컴포넌트에
  // 문자열로 전달한다.
  const displaySubsteps: DisplaySubstep[] = milestone.substeps.map((step) => ({
    id: step.id,
    kind: step.kind,
    title: tMilestones(`${milestone.id}.substeps.${step.id}`),
    externalUrl: step.externalUrl,
    estimatedLabel:
      step.estimatedSeconds !== null
        ? tRun("estimatedSeconds", { seconds: step.estimatedSeconds })
        : null,
  }));

  const substepLabels = {
    checkLabel: tRun("checkLabel"),
    autoRunning: tRun("autoRunning"),
    userActionRequired: tRun("userActionRequired"),
    openExternal: tRun("openExternal"),
    verifyCta: tRun("verifyCta"),
  };

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-6 py-12">
      {/* 브레드크럼: 대시보드 / 프로젝트명 / 마일스톤 제목 */}
      <nav className="relative z-50 mb-6 flex items-center gap-1.5 text-xs text-muted-foreground" style={{ pointerEvents: "auto" }}>
        <Link href="/dashboard" className="cursor-pointer hover:text-foreground">
          {tProjects("breadcrumbDashboard")}
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${project.id}`}
          className="cursor-pointer hover:text-foreground"
        >
          {project.name}
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">
          {tMilestones(`${milestone.id}.title`)}
        </span>
      </nav>

      {/* 헤더 */}
      <header className="mb-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <TrackBadge track={track.id} color={track.colorToken} size="sm" />
          <span className="text-xs font-mono text-muted-foreground">
            {tProjects("milestoneIndex", { current: order, total })}
          </span>
          <ExtensionStatus state="disconnected" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tMilestones(`${milestone.id}.title`)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {tRun("headerOutcome")}
            </span>
            : {tMilestones(`${milestone.id}.outcome`)}
          </p>
        </div>
      </header>

      {/* 삭제된 외부 리소스 알림 */}
      {removedResources.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">
            🔄 외부 서비스 상태가 변경되었습니다
          </p>
          <p className="mt-1 text-xs text-amber-400/80">
            {removedResources.map((r) =>
              r === "github_repo" ? "GitHub 저장소" :
              r === "vercel_project" ? "Vercel 프로젝트" : r
            ).join(", ")}
            {" "}가 삭제된 것을 감지했습니다. 해당 단계를 다시 진행해 주세요.
          </p>
        </div>
      )}

      {/* 사이드바(진행 단계, sticky) + 메인(액션 패널들) 2단 레이아웃.
          flex with align-items: flex-start — sticky가 안정적으로 동작하는
          가장 검증된 패턴. md 미만(768px)에서는 단일 컬럼 stack. */}
      <MaybeCompletedSubstepsProvider
        milestoneId={milestone.id}
        initialIds={initialCompletedSubsteps}
      >
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <aside
          className="w-full md:shrink-0"
          style={{
            flexBasis: "400px",
            maxWidth: "400px",
            position: "sticky",
            top: "1.5rem",
            maxHeight: "calc(100vh - 3rem)",
            overflowY: "auto",
            alignSelf: "flex-start",
          }}
        >
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {tRun("substepsTitle")}
            </h2>
            <SubstepList
              substeps={displaySubsteps}
              initialCompletedIds={initialCompletedSubsteps}
              labels={substepLabels}
            />
          </section>
        </aside>

        {/* 우측 메인 — 액션 패널들 + 결과 미리보기 */}
        <div className="min-w-0 md:flex-1">
          {/* M2 (1) Supabase 계정 연결 — m2-s1 */}
          {supabaseRows.length > 0 && (
            <div id="panel-m2-s1-supabase-oauth" className="scroll-mt-8">
            <OAuthConnectionPanel
              rows={supabaseRows}
              projectId={project.id}
              milestoneId={milestone.id}
              locale={locale}
              labels={supabasePanelLabels}
            />
            </div>
          )}

          {/* M2 (2) Supabase 프로젝트 자동 생성 — m2-s2 */}
          {createSupabasePanelData && createSupabaseSubstep && (
            <div id={`panel-${createSupabaseSubstep.id}`} className="scroll-mt-8">
              <CreateSupabaseProjectPanel
                projectId={project.id}
                milestoneId={milestone.id}
                substepId={createSupabaseSubstep.id}
                locale={locale}
                state={createSupabasePanelData.state}
                dashboardUrl={createSupabasePanelData.dashboardUrl}
                labels={createSupabasePanelData.labels}
              />
            </div>
          )}

          {/* M2 (3) Google OAuth 키 수집 — m2-s3 */}
          {googleKeysPanelData && googleKeysSubstep && (
            <div id={`panel-${googleKeysSubstep.id}`} className="scroll-mt-8">
              <GoogleOAuthKeysPanel
                projectId={project.id}
                milestoneId={milestone.id}
                substepId={googleKeysSubstep.id}
                locale={locale}
                state={googleKeysPanelData.state}
                redirectUri={googleKeysPanelData.redirectUri}
                externalUrl={googleKeysPanelData.externalUrl}
                savedClientIdMasked={googleKeysPanelData.savedClientIdMasked}
                labels={googleKeysPanelData.labels}
              />
            </div>
          )}

          {/* M2 (4) Supabase에 Google provider 활성화 — m2-s4 */}
          {enableGooglePanelData && enableGoogleSubstep && (
            <div id={`panel-${enableGoogleSubstep.id}`} className="scroll-mt-8">
              <EnableGoogleProviderPanel
                projectId={project.id}
                milestoneId={milestone.id}
                substepId={enableGoogleSubstep.id}
                locale={locale}
                state={enableGooglePanelData.state}
                labels={enableGooglePanelData.labels}
              />
            </div>
          )}

          {/* M2 (5) Auth UI 설치 — m2-s5 (+ m2-s6 verify 자동 완료) */}
          {installAuthUiPanelData && installAuthUiSubstep && (
            <div id={`panel-${installAuthUiSubstep.id}`} className="scroll-mt-8">
              <InstallAuthUiPanel
                projectId={project.id}
                milestoneId={milestone.id}
                substepId={installAuthUiSubstep.id}
                locale={locale}
                state={installAuthUiPanelData.state}
                deployedUrl={installAuthUiPanelData.deployedUrl}
                labels={installAuthUiPanelData.labels}
              />
            </div>
          )}

          {/* M1 (1) GitHub 계정 연결 — m1-s1 */}
          {githubRows.length > 0 && (
            <div id="panel-m1-s1-github-oauth" className="scroll-mt-8">
              <OAuthConnectionPanel
                rows={githubRows}
                projectId={project.id}
                milestoneId={milestone.id}
                locale={locale}
                labels={githubPanelLabels}
              />
            </div>
          )}

          {/* (2) GitHub 저장소 자동 생성 — m1-s2 */}
          {createRepoPanelData && createRepoSubstep && (
            <div id={`panel-${createRepoSubstep.id}`} className="scroll-mt-8">
              <CreateRepoPanel
                projectId={project.id}
                milestoneId={milestone.id}
                substepId={createRepoSubstep.id}
                locale={locale}
                state={createRepoPanelData.state}
                existingRepoUrl={createRepoPanelData.existingRepoUrl}
                labels={createRepoPanelData.labels}
              />
            </div>
          )}

          {/* (3) 내 프로젝트를 GitHub에 올리기 — m1-s3 */}
          {milestone.id === "m1-deploy" && (
            <div id="panel-m1-s3-git-push" className="scroll-mt-8">
              <GitPushPanel
                projectName={project.slug}
                githubUsername={githubUsernameForPush}
                repoCreated={!!existingRepo}
                completed={initialCompletedSubsteps.includes("m1-s3-git-push")}
                labels={{
                  title: tGitPush("title"),
                  description: tGitPush("description"),
                  copyButton: tGitPush("copyButton"),
                  copiedButton: tGitPush("copiedButton"),
                  doneButton: tGitPush("doneButton"),
                  waitingRepo: tGitPush("waitingRepo"),
                  completedMessage: tGitPush("completedMessage"),
                  folderMovedHint: tGitPush("folderMovedHint"),
                  folderMovedPrompt: tGitPush("folderMovedPrompt"),
                }}
                onComplete={async () => {
                  "use server";
                  const { toggleSubstepAction } = await import("./actions");
                  return toggleSubstepAction(project.id, milestone.id, "m1-s3-git-push", true);
                }}
              />
            </div>
          )}

          {/* (4) Vercel 계정 연결 — m1-s4 */}
          {vercelRows.length > 0 && (
            <div id="panel-m1-s4-vercel-oauth" className="scroll-mt-8">
              <OAuthConnectionPanel
                rows={vercelRows}
                projectId={project.id}
                milestoneId={milestone.id}
                locale={locale}
                labels={vercelPanelLabels}
              />
            </div>
          )}

          {/* (5) 첫 배포 — m1-s5 */}
          {deployPanelData && deploySubstep && (
            <div id={`panel-${deploySubstep.id}`} className="scroll-mt-8">
              <DeployPanel
                projectId={project.id}
                milestoneId={milestone.id}
                substepId={deploySubstep.id}
                locale={locale}
                state={deployPanelData.state}
                deployedUrl={deployPanelData.deployedUrl}
                labels={deployPanelData.labels}
              />
            </div>
          )}

          {/* M3 바이브코딩 패널 */}
          {milestone.id === "m3-vibe-coding" && vibeCodingData && (
            <VibeCodingPanel
              projectName={project.slug}
              os={project.os}
              deployedUrl={vibeCodingData.deployedUrl}
              completedSteps={initialCompletedSubsteps}
              labels={vibeCodingData.labels}
              onComplete={async (substepId: string, checked: boolean) => {
                "use server";
                const { toggleSubstepAction } = await import("./actions");
                return toggleSubstepAction(project.id, milestone.id, substepId, checked);
              }}
            />
          )}

          {/* 결과 미리보기 */}
          <ResultPreview
            kind={milestone.previewKind}
            completed={currentState === "completed"}
            title={tRun("previewTitle")}
          />
        </div>
      </div>
      {/* 마일스톤 완료 축하 — Provider 안에서 context 기반 즉시 판단.
          deployedUrl은 모든 마일스톤에서 공통으로 사용하기 위해 existingVercelProject를 재사용한다. */}
      <MilestoneCelebration
        completed={currentState === "completed"}
        allSubstepIds={milestone.substeps.map((s) => s.id)}
        deployedUrl={existingVercelProject?.url ?? null}
        dashboardUrl={`/${locale}/projects/${project.id}`}
        projectName={project.name}
        userName={user.displayName}
        labels={{
          title: tMilestones.has(`${milestone.id}.celebrationTitle`)
            ? tMilestones(`${milestone.id}.celebrationTitle`)
            : tRun("celebrationTitle"),
          description: tMilestones.has(`${milestone.id}.celebrationDescription`)
            ? tMilestones(`${milestone.id}.celebrationDescription`)
            : tRun("celebrationDescription"),
          ctaLabel: tRun("celebrationCta"),
          openSite: tRun("celebrationOpenSite"),
          previewLabel: tRun("celebrationPreviewLabel"),
          shareHeading: tRun("celebrationShareHeading"),
          shareSubheading: tRun("celebrationShareSubheading"),
          shareCardLabel: tRun("celebrationShareCardLabel"),
          share: {
            shareText: tRun("shareText"),
            copy: tRun("shareCopy"),
            copied: tRun("shareCopied"),
            share: tRun("shareShare"),
            shareOnX: tRun("shareOnX"),
            qr: tRun("shareQr"),
            qrDescription: tRun("shareQrDescription"),
          },
        }}
      />
      </MaybeCompletedSubstepsProvider>

      <Separator className="my-10" />

      {/* MCP 자동 설치 안내 — 미구현, VS Code Extension 완성 후 활성화
         TODO: project_mcp_auto_install.md 참조 */}

      {/* 하단 네비게이션: 이전 마일스톤 / 대시보드 / 다음 마일스톤 */}
      {(() => {
        const currentIdx = allMilestones.findIndex(
          (m) => m.id === milestone.id,
        );
        const prevMilestone =
          currentIdx > 0 ? allMilestones[currentIdx - 1] : null;
        const showNext =
          milestone.unlocks && currentState === "completed";

        return (
          <div className="mt-10 flex items-center justify-between gap-4">
            {/* 좌측: 이전 마일스톤 */}
            <div>
              {prevMilestone && (
                <Link
                  href={`/projects/${project.id}/m/${prevMilestone.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← {tRun("prevMilestoneCta")}
                </Link>
              )}
            </div>

            {/* 중앙: 대시보드 */}
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {tProjects("breadcrumbDashboard")}
            </Link>

            {/* 우측: 다음 마일스톤 */}
            <div>
              {showNext && (
                <Link
                  href={`/projects/${project.id}/m/${milestone.unlocks}`}
                  className="no-underline"
                >
                  <Button size="lg">{tRun("nextMilestoneCta")}</Button>
                </Link>
              )}
            </div>
          </div>
        );
      })()}
    </main>
  );
}
