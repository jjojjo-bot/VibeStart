/**
 * CreateRepoPanel — M1 마일스톤의 GitHub 저장소 자동 생성 패널.
 *
 * OAuthConnectionPanel과 대칭. createGitHubRepoAction을 직접 import해서
 * <form action={...}>로 호출한다 ((라)-1에서 검증된 client → server action
 * 패턴). 상태별로 disabled / form / 성공 표시 분기.
 *
 * 비즈니스 판정(githubConnected, createRepoDone, existingRepo)은 모두 page
 * 서버 컴포넌트가 미리 계산해서 props로 전달한다.
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { createGitHubRepoAction } from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type CreateRepoPanelState = "needs-oauth" | "ready" | "created";

export interface CreateRepoPanelLabels {
  title: string;
  description: string;
  ctaCreateRepo: string;
  waitingOauth: string;
  createdSuccess: string | null;
  alreadyExists: string | null;
  openOnGithub: string;
  errorMessage: string | null;
}

export interface CreateRepoPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: CreateRepoPanelState;
  existingRepoUrl: string | null;
  labels: CreateRepoPanelLabels;
}

export function CreateRepoPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  existingRepoUrl,
  labels,
}: CreateRepoPanelProps): React.ReactNode {
  return (
    <section
      className="mb-8 rounded-lg border border-border bg-card p-5"
      data-testid="create-repo-panel"
      data-state={state}
    >
      <h2 className="mb-1 text-sm font-medium text-muted-foreground">
        {labels.title}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">{labels.description}</p>

      {labels.errorMessage && (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          ⚠️ {labels.errorMessage}
        </div>
      )}

      {state === "created" && labels.createdSuccess && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.createdSuccess}
        </div>
      )}
      {state === "created" && !labels.createdSuccess && labels.alreadyExists && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.alreadyExists}
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 p-3",
          state === "created" && "border-primary/40 bg-primary/5",
        )}
      >
        <span aria-hidden="true" className="text-xl leading-none">
          📦
        </span>
        <div className="min-w-0 flex-1">
          {state === "needs-oauth" && (
            <p className="text-sm text-muted-foreground">
              {labels.waitingOauth}
            </p>
          )}
          {state === "ready" && (
            <p className="text-sm text-foreground">{labels.ctaCreateRepo}</p>
          )}
          {state === "created" && existingRepoUrl && (
            <a
              href={existingRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-2"
            >
              {labels.openOnGithub} ↗
            </a>
          )}
        </div>

        {state === "needs-oauth" && (
          <Button type="button" size="sm" disabled>
            {labels.ctaCreateRepo}
          </Button>
        )}
        {state === "ready" && (
          <form action={createGitHubRepoAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="substepId" value={substepId} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" size="sm">
              {labels.ctaCreateRepo}
            </Button>
          </form>
        )}
        {state === "created" && (
          <span aria-label="created" className="text-sm text-emerald-400">
            ✓
          </span>
        )}
      </div>
    </section>
  );
}
