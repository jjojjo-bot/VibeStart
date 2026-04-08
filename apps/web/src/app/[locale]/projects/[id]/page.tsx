/**
 * /projects/[id] — 프로젝트 마일스톤 트리 (정적 트랙 5개).
 *
 * 프로젝트 소유자만 접근 가능. 헤더에 트랙 뱃지, 진행도 점, Extension 상태를
 * 배치하고 본문에 5개 마일스톤 카드를 세로로 나열한다. 잠긴 카드는 Link
 * 없이 렌더되고, 활성/완료 카드만 상세 페이지로 이동 가능.
 */

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  ExtensionStatus,
  MilestoneCard,
  ProgressDots,
  TrackBadge,
} from "@/components/milestone";
import {
  getDummyProject,
  getProjectProgress,
} from "@/lib/projects/in-memory-store";

interface ProjectTreePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProjectTreePage({
  params,
}: ProjectTreePageProps): Promise<React.ReactNode> {
  const { locale, id } = await params;
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
  if (!track) notFound();

  const milestones = catalog.listMilestones(project.track);
  const progress = getProjectProgress(
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
