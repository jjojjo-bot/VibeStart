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

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  CreateRepoPanel,
  type CreateRepoPanelState,
  DeployPanel,
  type DeployPanelState,
  type DisplaySubstep,
  ExtensionStatus,
  ResultPreview,
  SubstepList,
  TrackBadge,
} from "@/components/milestone";
import {
  OAuthConnectionPanel,
  type OAuthConnectionRow,
} from "@/components/milestone/oauth-connection-panel";
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
  getDummyProject,
  getProjectProgress,
  getProjectResourceByType,
  markSubstepCompleted,
} from "@/lib/projects/in-memory-store";
import {
  SUPPORTED_PROVIDERS,
  providerFromSubstepId,
  providerLabel,
} from "@/lib/projects/substep-provider";

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

  const project = getDummyProject(id);
  if (!project || project.userId !== user.id) {
    notFound();
  }

  const catalog = createInMemoryMilestoneCatalog();
  const track = catalog.getTrack(project.track);
  const milestone = catalog.getMilestone(project.track, milestoneId);
  if (!track || !milestone) {
    notFound();
  }

  const allMilestones = catalog.listMilestones(project.track);
  const total = allMilestones.length;
  const order = milestone.order;

  const progress = getProjectProgress(
    project.id,
    allMilestones.map((m) => m.id),
  );
  let currentState = progress[milestone.id] ?? "locked";
  const storedCompletedSubsteps = getCompletedSubstepIds(
    project.id,
    milestone.id,
  );

  const tRun = await getTranslations("MilestoneRun");
  const tMilestones = await getTranslations("Milestones");
  const tProjects = await getTranslations("Projects");
  const tConnections = await getTranslations("Connections");
  const tCreateRepo = await getTranslations("CreateRepo");
  const tDeploy = await getTranslations("FirstDeploy");

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
  let existingRepo = getProjectResourceByType(project.id, "github_repo");
  if (createRepoSubstep && !existingRepo) {
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
            existingRepo = addProjectResource({
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

  const initialCompletedSubsteps = Array.from(
    new Set([
      ...storedCompletedSubsteps,
      ...derivedCompletedFromOauth,
      ...derivedCompletedFromResources,
    ]),
  );

  // 성공/에러 토스트 메시지. github와 vercel 두 provider가 같은 패널을
  // 공유하므로 둘 다 처리. 동시 발생은 거의 없지만 vercel을 우선으로 표시.
  const githubConnected = query.github_connected === "1";
  const vercelConnected = query.vercel_connected === "1";
  const oauthError =
    typeof query.oauth_error === "string" ? query.oauth_error : null;
  const vercelError =
    typeof query.vercel_error === "string" ? query.vercel_error : null;

  // Substep 카탈로그 순서 (s1 GitHub → s2 저장소 → s3 Vercel)에 맞춰 OAuth
  // 패널을 provider별로 분리해 렌더한다. 각 패널은 자기 provider 토스트만
  // 표시.
  const githubRows = connectionRows.filter((r) => r.provider === "github");
  const vercelRows = connectionRows.filter((r) => r.provider === "vercel");

  const baseConnectionLabels = {
    connectButton: tConnections("connectButton"),
    connecting: tConnections("connecting"),
    comingSoon: tConnections("comingSoon"),
    vercelHelperText: tConnections("vercelHelperText"),
    vercelHelperLink: tConnections("vercelHelperLink"),
    vercelTokenPlaceholder: tConnections("vercelTokenPlaceholder"),
    vercelConnectButton: tConnections("vercelConnectButton"),
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

  // DeployPanel — m1-s4-first-deploy. 선행: github_repo + vercel 연결.
  const deploySubstep = milestone.substeps.find(
    (s) => s.id === "m1-s4-first-deploy",
  );
  const existingVercelProject = getProjectResourceByType(
    project.id,
    "vercel_project",
  );
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
        errorMessage: deployErrorRaw
          ? resolveDeployError(deployErrorRaw, tDeploy)
          : null,
      },
    };
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

  // 모든 derive 결과를 store에 동기화 — OAuth/Resource derive로만 UI에 표시되던
  // substep을 retroactively store에 마킹해 milestoneState가 정상 전환되도록.
  // store가 이미 가진 substep은 markSubstepCompleted가 idempotent로 처리.
  const alreadyStored = new Set(storedCompletedSubsteps);
  let storeChanged = false;
  for (const id of initialCompletedSubsteps) {
    if (!alreadyStored.has(id)) {
      markSubstepCompleted({
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
    const updatedProgress = getProjectProgress(
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
      {/* 상단: 대시보드로 돌아가기 */}
      <div className="mb-6">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {tProjects("backToTree")}
        </Link>
      </div>

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

      {/* 사이드바(진행 단계, sticky) + 메인(액션 패널들) 2단 레이아웃 */}
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* 좌측 사이드바 — 진행 단계. lg+ 에서 sticky로 고정. */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
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
        <div className="min-w-0">
          {/* (1) GitHub 계정 연결 — m1-s1 */}
          {githubRows.length > 0 && (
            <OAuthConnectionPanel
              rows={githubRows}
              projectId={project.id}
              milestoneId={milestone.id}
              locale={locale}
              labels={githubPanelLabels}
            />
          )}

          {/* (2) GitHub 저장소 자동 생성 — m1-s2 */}
          {createRepoPanelData && createRepoSubstep && (
            <CreateRepoPanel
              projectId={project.id}
              milestoneId={milestone.id}
              substepId={createRepoSubstep.id}
              locale={locale}
              state={createRepoPanelData.state}
              existingRepoUrl={createRepoPanelData.existingRepoUrl}
              labels={createRepoPanelData.labels}
            />
          )}

          {/* (3) Vercel 계정 연결 — m1-s3 */}
          {vercelRows.length > 0 && (
            <OAuthConnectionPanel
              rows={vercelRows}
              projectId={project.id}
              milestoneId={milestone.id}
              locale={locale}
              labels={vercelPanelLabels}
            />
          )}

          {/* (4) 첫 배포 — m1-s4 */}
          {deployPanelData && deploySubstep && (
            <DeployPanel
              projectId={project.id}
              milestoneId={milestone.id}
              substepId={deploySubstep.id}
              locale={locale}
              state={deployPanelData.state}
              deployedUrl={deployPanelData.deployedUrl}
              labels={deployPanelData.labels}
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

      <Separator className="my-10" />

      {/* MCP 자동 설치 안내 */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {tRun("mcpInstallTitle")}
        </h2>
        <ul className="space-y-2">
          {milestone.mcpInstalls.map((mcp) => (
            <li
              key={mcp.name}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <span className="font-mono text-xs rounded bg-muted px-1.5 py-0.5">
                {mcp.name}
              </span>
              <span className="text-muted-foreground">
                {tMilestones(`${milestone.id}.mcp.${mcp.name}`)}
              </span>
              {mcp.slashCommands.length > 0 && (
                <span className="ml-auto font-mono text-[10px] text-muted-foreground/80">
                  {mcp.slashCommands.join(" · ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 다음 마일스톤 CTA (완료 상태일 때만) */}
      {milestone.unlocks && currentState === "completed" && (
        <div className="mt-10 flex justify-end">
          <Link
            href={`/projects/${project.id}/m/${milestone.unlocks}`}
            className="no-underline"
          >
            <Button size="lg">{tRun("nextMilestoneCta")}</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
