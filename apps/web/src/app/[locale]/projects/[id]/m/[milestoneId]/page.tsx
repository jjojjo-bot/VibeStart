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
import { getOAuthConnection } from "@/lib/auth/oauth-connections";
import {
  getCompletedSubstepIds,
  getDummyProject,
  getProjectProgress,
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
  const currentState = progress[milestone.id] ?? "locked";
  const initialCompletedSubsteps = getCompletedSubstepIds(
    project.id,
    milestone.id,
  );

  const tRun = await getTranslations("MilestoneRun");
  const tMilestones = await getTranslations("Milestones");
  const tProjects = await getTranslations("Projects");
  const tConnections = await getTranslations("Connections");

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

  // 성공/에러 토스트 메시지
  const githubConnected = query.github_connected === "1";
  const oauthError =
    typeof query.oauth_error === "string" ? query.oauth_error : null;
  const connectionLabels = {
    title: tConnections("title"),
    connectButton: tConnections("connectButton"),
    comingSoon: tConnections("comingSoon"),
    successMessage: githubConnected ? tConnections("successGithub") : null,
    errorMessage: oauthError
      ? tConnections("errorGeneric", { code: oauthError })
      : null,
  };

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
    <main id="main-content" className="mx-auto max-w-5xl px-6 py-12">
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

      {/* OAuth 연결 관리 패널 (oauth kind 서브스텝이 있을 때만) */}
      <OAuthConnectionPanel
        rows={connectionRows}
        projectId={project.id}
        milestoneId={milestone.id}
        locale={locale}
        labels={connectionLabels}
      />

      {/* 본문 — 서브스텝 + 결과 미리보기 */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {tRun("substepsTitle")}
          </h2>
          <SubstepList
            substeps={displaySubsteps}
            initialCompletedIds={initialCompletedSubsteps}
            labels={substepLabels}
          />
        </section>
        <section>
          <ResultPreview
            kind={milestone.previewKind}
            completed={currentState === "completed"}
            title={tRun("previewTitle")}
          />
        </section>
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
