/**
 * DeployPanel — M1 마일스톤의 Vercel 첫 배포 패널.
 *
 * PendingButton(client component)을 사용해 서버 액션 진행 중 "배포 중..."
 * 로딩 표시. firstDeployAction은 10~30초 걸릴 수 있으므로 피드백 필수.
 */

import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import { firstDeployAction } from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type DeployPanelState =
  | "needs-repo"
  | "needs-vercel"
  | "ready"
  | "deployed";

export interface DeployPanelLabels {
  title: string;
  description: string;
  ctaDeploy: string;
  /** 서버 액션 진행 중 버튼에 표시할 텍스트 ("배포 중...") */
  deploying: string;
  waitingRepo: string;
  waitingVercel: string;
  deployedSuccess: string | null;
  alreadyDeployed: string | null;
  deployingMessage: string | null;
  openSite: string;
  errorMessage: string | null;
}

export interface DeployPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: DeployPanelState;
  deployedUrl: string | null;
  labels: DeployPanelLabels;
}

export function DeployPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  deployedUrl,
  labels,
}: DeployPanelProps): React.ReactNode {
  return (
    <section
      className="mb-8 rounded-lg border border-border bg-card p-5"
      data-testid="deploy-panel"
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

      {state === "deployed" && labels.deployedSuccess && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.deployedSuccess}
        </div>
      )}
      {state === "deployed" && !labels.deployedSuccess && labels.alreadyDeployed && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.alreadyDeployed}
        </div>
      )}
      {state === "deployed" && labels.deployingMessage && (
        <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          ⏳ {labels.deployingMessage}
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 p-3",
          state === "deployed" && "border-primary/40 bg-primary/5",
        )}
      >
        <span aria-hidden="true" className="text-xl leading-none">
          🚀
        </span>
        <div className="min-w-0 flex-1">
          {state === "needs-repo" && (
            <p className="text-sm text-muted-foreground">
              {labels.waitingRepo}
            </p>
          )}
          {state === "needs-vercel" && (
            <p className="text-sm text-muted-foreground">
              {labels.waitingVercel}
            </p>
          )}
          {state === "ready" && (
            <p className="text-sm text-foreground">{labels.ctaDeploy}</p>
          )}
          {state === "deployed" && deployedUrl && (
            <a
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-2"
            >
              {labels.openSite} ↗
            </a>
          )}
        </div>

        {(state === "needs-repo" || state === "needs-vercel") && (
          <Button type="button" size="sm" disabled>
            {labels.ctaDeploy}
          </Button>
        )}
        {state === "ready" && (
          <form action={firstDeployAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="substepId" value={substepId} />
            <input type="hidden" name="locale" value={locale} />
            <PendingButton
              type="submit"
              size="sm"
              pendingText={labels.deploying}
            >
              {labels.ctaDeploy}
            </PendingButton>
          </form>
        )}
        {state === "deployed" && (
          <span aria-label="deployed" className="text-sm text-emerald-400">
            ✓
          </span>
        )}
      </div>
    </section>
  );
}
