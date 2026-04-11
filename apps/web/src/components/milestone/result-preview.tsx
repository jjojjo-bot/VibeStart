/**
 * ResultPreview — 마일스톤이 끝나면 "눈에 보이는 변화"를 미리 보여주는 카드.
 *
 * previewKind에 따라 다른 placeholder 시각물을 렌더한다 (vercel 배포 URL,
 * Google 로그인 버튼, 분석 그래프, Sentry 이슈, 도메인 배너). 마일스톤
 * 완료 전에는 grayscale + 설명, 완료 후에는 컬러로 바뀐다.
 *
 * Server Component — SVG/텍스트 placeholder라 클라이언트 상태 불필요.
 */

import type { MilestonePreviewKind } from "@vibestart/shared-types";

import { cn } from "@/lib/utils";

export interface ResultPreviewProps {
  kind: MilestonePreviewKind;
  completed: boolean;
  /** 미리보기 안에 표시할 예시 값 (예: "my-portfolio.vercel.app") */
  placeholderValue?: string;
  /** i18n 제목 ("결과 미리보기") */
  title: string;
  className?: string;
}

export function ResultPreview({
  kind,
  completed,
  placeholderValue,
  title,
  className,
}: ResultPreviewProps): React.ReactNode {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        !completed && "opacity-70",
        className,
      )}
      data-preview-kind={kind}
      data-completed={completed}
    >
      <p className="mb-3 text-xs font-medium text-muted-foreground">{title}</p>
      <div
        className={cn(
          "flex min-h-32 items-center justify-center rounded-md border border-dashed border-border bg-background/50 p-4",
          !completed && "grayscale",
        )}
      >
        <PreviewBody kind={kind} placeholderValue={placeholderValue} />
      </div>
    </div>
  );
}

function PreviewBody({
  kind,
  placeholderValue,
}: {
  kind: MilestonePreviewKind;
  placeholderValue?: string;
}): React.ReactNode {
  switch (kind) {
    case "vercel-deploy":
      return (
        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-mono">
            <span className="text-emerald-400">●</span>
            <span>{placeholderValue ?? "my-portfolio.vercel.app"}</span>
          </div>
          <p className="text-xs text-muted-foreground">🚀 배포 준비</p>
        </div>
      );
    case "auth-form":
      return (
        <div className="w-full max-w-[200px]">
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className="inline-block size-3 rounded-sm bg-gradient-to-br from-sky-400 via-amber-400 to-rose-400"
              />
              Google로 로그인
            </div>
          </div>
        </div>
      );
    case "analytics-chart":
      return (
        <svg viewBox="0 0 120 48" className="h-12 w-28 text-primary">
          <polyline
            points="0,38 15,30 30,32 45,24 60,26 75,16 90,18 105,10 120,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="120" cy="12" r="2.5" fill="currentColor" />
        </svg>
      );
    case "sentry-issue":
      return (
        <div className="w-full max-w-[240px] space-y-1">
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-destructive">
              <span aria-hidden="true">⚠️</span>
              Test error from VibeStart
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              app/page.tsx:42 · 1 user
            </div>
          </div>
        </div>
      );
    case "domain-banner":
      return (
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono">
            <span aria-hidden="true">🔒</span>
            <span>{placeholderValue ?? "brandon.dev"}</span>
          </div>
        </div>
      );
    case "vibe-coding-diff":
      return (
        <div className="w-full max-w-[260px] space-y-1 font-mono text-[10px]">
          <div className="rounded-md border border-border bg-background px-2 py-1.5">
            <div className="text-red-400">- Welcome to Next.js</div>
            <div className="text-emerald-400">+ 내가 만든 포트폴리오</div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            AI → push → 자동 배포
          </p>
        </div>
      );
  }
}
