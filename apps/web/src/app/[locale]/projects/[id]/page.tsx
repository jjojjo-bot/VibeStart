/**
 * /projects/[id] — 프로젝트 마일스톤 트리 (정적 트랙 5개).
 *
 * 프로젝트 소유자만 접근 가능. 헤더에 트랙 뱃지, 진행도 점, Extension 상태를
 * 배치하고 본문에 5개 마일스톤 카드를 세로로 나열한다. 잠긴 카드는 Link
 * 없이 렌더되고, 활성/완료 카드만 상세 페이지로 이동 가능.
 */

import { notFound, redirect as redirectRaw } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  ExtensionStatus,
  MilestoneCard,
  ProgressDots,
  TrackBadge,
} from "@/components/milestone";
import {
  getProject,
  getProjectProgress,
} from "@/lib/projects/project-store";
import { verifyProjectResources } from "@/lib/projects/verify-resources";

interface ProjectTreePageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectTreePage({
  params,
  searchParams,
}: ProjectTreePageProps): Promise<React.ReactNode> {
  const { locale, id } = await params;
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

  // 외부 리소스 검증 — 삭제된 리소스는 DB에서 자동 정리.
  // 마일스톤 페이지와 동일하게 cleanup 발생 시 같은 경로로 redirect해
  // 새 render tree에서 fresh DB 상태를 읽도록 한다 (Next.js Request
  // Memoization 우회). 2차 render는 URL 쿼리의 resources_cleaned를 읽어
  // 배너만 노출하고 verify는 clean 상태라 더 이상 redirect하지 않는다.
  const verificationResults = await verifyProjectResources(project.id, user.id);
  const freshlyRemoved = verificationResults
    .filter((r) => r.status === "gone")
    .map((r) => r.resourceType);

  const alreadyCleanedRaw = query.resources_cleaned;
  if (freshlyRemoved.length > 0 && typeof alreadyCleanedRaw !== "string") {
    const cleanedParam = encodeURIComponent(freshlyRemoved.join(","));
    const prefix = locale === "ko" ? "" : `/${locale}`;
    redirectRaw(`${prefix}/projects/${id}?resources_cleaned=${cleanedParam}`);
  }

  const removedResources =
    freshlyRemoved.length > 0
      ? freshlyRemoved
      : typeof alreadyCleanedRaw === "string"
        ? alreadyCleanedRaw.split(",").filter(Boolean)
        : [];

  const catalog = createInMemoryMilestoneCatalog();
  const track = catalog.getTrack(project.track);
  if (!track) notFound();

  const milestones = catalog.listMilestones(project.track);
  const progress = await getProjectProgress(
    project.id,
    milestones.map((m) => m.id),
  );

  const tProjects = await getTranslations("Projects");
  const tMilestones = await getTranslations("Milestones");

  const completedCount = milestones.filter(
    (m) => progress[m.id] === "completed",
  ).length;
  const activeIndex = milestones.findIndex(
    (m) => progress[m.id] === "in_progress",
  );

  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-6 py-16"
    >
      {/* 브레드크럼 */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-foreground"
        >
          {tProjects("breadcrumbDashboard")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{project.name}</span>
      </nav>

      {/* 삭제된 외부 리소스 알림 */}
      {removedResources.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">
            🔄 외부 서비스 상태가 변경되었습니다
          </p>
          <p className="mt-1 text-xs text-amber-400/80">
            {removedResources
              .map((r) =>
                r === "github_repo"
                  ? "GitHub 저장소"
                  : r === "vercel_project"
                    ? "Vercel 프로젝트"
                    : r === "supabase_project"
                      ? "Supabase 프로젝트"
                      : r,
              )
              .join(", ")}
            {" "}가 삭제된 것을 감지했습니다. 해당 단계를 다시 진행해 주세요.
          </p>
        </div>
      )}

      <header className="mb-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <TrackBadge track={track.id} color={track.colorToken} size="sm" />
          <ExtensionStatus state="disconnected" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tProjects("treeTitle", { name: project.name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tProjects("treeSubtitle")}
          </p>
        </div>
        <ProgressDots
          total={milestones.length}
          completedCount={completedCount}
          activeIndex={activeIndex}
          ariaLabel={tProjects("milestoneIndex", {
            current: completedCount + 1,
            total: milestones.length,
          })}
        />
      </header>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const state = progress[milestone.id] ?? "locked";
          return (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              state={state}
              variant="tree-node"
              indexLabel={tProjects("milestoneIndex", {
                current: index + 1,
                total: milestones.length,
              })}
              title={tMilestones(`${milestone.id}.title`)}
              outcome={tMilestones(`${milestone.id}.outcome`)}
              lockedHint={tProjects("lockedHint")}
              href={`/projects/${project.id}/m/${milestone.id}`}
            />
          );
        })}
      </div>
    </main>
  );
}
