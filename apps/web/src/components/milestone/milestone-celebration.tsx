"use client";

/**
 * MilestoneCelebration — 마일스톤 전체 완료 시 축하 화면.
 *
 * 배포된 URL이 있고 hero 모드 props(projectName/userName/locale)가 전달되면
 * 임팩트 버전을 렌더한다 (iframe 미리보기 + share 카드 썸네일 + 공유 액션
 * 클러스터 + 자랑 유도 카피). 그 외에는 기존 간단 배너 폴백을 사용해
 * 다른 마일스톤(m2/m3)의 기존 UX를 깨지 않는다.
 *
 * CompletedSubstepsContext가 있으면 낙관적 상태로 즉시 판단, 없으면
 * 서버에서 전달한 completed prop 사용.
 */

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { useOptionalCompletedSubsteps } from "./completed-substeps-context";
import { ShareActions, type ShareActionsLabels } from "./share-actions";
import { SitePreviewFrame } from "./site-preview-frame";

export interface MilestoneCelebrationLabels {
  title: string;
  description: string;
  ctaLabel: string;
  /** 자랑 섹션 라벨 — hero 모드에서만 사용 */
  shareHeading?: string;
  shareSubheading?: string;
  previewLabel?: string;
  shareCardLabel?: string;
  openSite?: string;
  share?: ShareActionsLabels;
}

export interface MilestoneCelebrationProps {
  /** 서버 렌더 시점의 완료 여부 (fallback) */
  completed: boolean;
  /** 전체 substep ID 목록 — context 기반 즉시 판단에 사용 */
  allSubstepIds: ReadonlyArray<string>;
  deployedUrl: string | null;
  dashboardUrl: string;
  labels: MilestoneCelebrationLabels;
  /** Hero 모드 props — 없으면 간단 배너 폴백 */
  projectName?: string;
  userName?: string;
}

export function MilestoneCelebration({
  completed: serverCompleted,
  allSubstepIds,
  deployedUrl,
  dashboardUrl,
  labels,
  projectName,
  userName,
}: MilestoneCelebrationProps): React.ReactNode {
  const contextCompleted = useOptionalCompletedSubsteps();

  const isCompleted = contextCompleted
    ? allSubstepIds.length > 0 &&
      allSubstepIds.every((id) => contextCompleted.has(id))
    : serverCompleted;

  const hasFired = useRef(false);

  useEffect(() => {
    if (isCompleted && !hasFired.current) {
      hasFired.current = true;
      const end = Date.now() + 1500;
      const frame = (): void => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: [
            "#7c3aed",
            "#22c55e",
            "#3b82f6",
            "#f59e0b",
            "#ef4444",
            "#fbbf24",
          ],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: [
            "#7c3aed",
            "#22c55e",
            "#3b82f6",
            "#f59e0b",
            "#ef4444",
            "#fbbf24",
          ],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    if (!isCompleted) hasFired.current = false;
  }, [isCompleted]);

  if (!isCompleted) return null;

  // Hero 모드: deployedUrl + projectName + userName + share labels 모두 존재해야 활성화.
  // 하나라도 빠지면 간단 배너로 폴백해서 기존 호출 경로 보호.
  const heroMode = Boolean(
    deployedUrl && projectName && userName && labels.share,
  );

  if (heroMode && deployedUrl && projectName && userName && labels.share) {
    const shareCardUrl = buildShareCardUrl({
      project: projectName,
      user: userName,
      url: deployedUrl,
    });

    return (
      <section className="mt-10 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-background to-background p-6 sm:p-10">
        {/* 헤드라인 */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-emerald-400 sm:text-3xl">
            {labels.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {labels.description}
          </p>
        </div>

        {/* 사이트 미리보기 */}
        <div className="mx-auto mb-8 max-w-3xl">
          {labels.previewLabel && (
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {labels.previewLabel}
            </p>
          )}
          <SitePreviewFrame url={deployedUrl} />
          <div className="mt-3 flex justify-center">
            <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                {labels.openSite ?? "내 사이트 열기 ↗"}
              </Button>
            </a>
          </div>
        </div>

        {/* 자랑 섹션 */}
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card/40 p-6">
          <div className="mb-5 text-center">
            <h3 className="text-lg font-semibold sm:text-xl">
              {labels.shareHeading}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {labels.shareSubheading}
            </p>
          </div>

          {/* Share 카드 썸네일 */}
          <div className="mb-5 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shareCardUrl}
              alt={labels.shareCardLabel ?? "share card"}
              width={1200}
              height={630}
              className="w-full"
            />
          </div>

          <ShareActions url={deployedUrl} labels={labels.share} />
        </div>

        {/* 대시보드 CTA */}
        <div className="mt-8 flex justify-center">
          <a href={dashboardUrl}>
            <Button size="lg">{labels.ctaLabel}</Button>
          </a>
        </div>
      </section>
    );
  }

  // 폴백: 기존 간단 배너 (M2/M3 용 및 deployedUrl 없는 경우)
  return (
    <section className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
      <h2 className="text-2xl font-bold text-emerald-400">{labels.title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{labels.description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {deployedUrl && (
          <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              {labels.openSite ?? "내 사이트 열기 ↗"}
            </Button>
          </a>
        )}
        <a href={dashboardUrl}>
          <Button size="sm">{labels.ctaLabel}</Button>
        </a>
      </div>
    </section>
  );
}

function buildShareCardUrl({
  project,
  user,
  url,
}: {
  project: string;
  user: string;
  url: string;
}): string {
  const params = new URLSearchParams({
    type: "share",
    project,
    user,
    url,
  });
  return `/api/og?${params.toString()}`;
}
