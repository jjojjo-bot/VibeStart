/**
 * InstallAuthUiPanel — M2 (마)-5 자동 단계.
 *
 * Supabase JS SDK로 Google 로그인 버튼이 포함된 index.html을 GitHub에 push해
 * Vercel이 자동 재배포하게 한다. EnableGoogleProviderPanel과 동일한 auto kind
 * 패턴 (단일 버튼 + pending/success/error 토스트).
 *
 * 상태 머신:
 *   - needs-provider: (마)-4 Google provider 활성화가 안 됨
 *   - ready: 선행 조건 모두 충족, 설치 버튼 활성
 *   - installed: 이미 설치 완료 (deployedUrl 링크 노출)
 */

import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import { installAuthUiAction } from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type InstallAuthUiPanelState =
  | "needs-provider"
  | "ready"
  | "installed";

export interface InstallAuthUiPanelLabels {
  title: string;
  description: string;
  ctaInstall: string;
  installing: string;
  waitingProvider: string;
  installedSuccess: string | null;
  alreadyInstalled: string;
  openSite: string;
  errorMessage: string | null;
}

export interface InstallAuthUiPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: InstallAuthUiPanelState;
  deployedUrl: string | null;
  labels: InstallAuthUiPanelLabels;
}

export function InstallAuthUiPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  deployedUrl,
  labels,
}: InstallAuthUiPanelProps): React.ReactNode {
  return (
    <section
      className="mb-8 rounded-lg border border-border bg-card p-5"
      data-testid="install-auth-ui-panel"
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

      {state === "installed" && labels.installedSuccess && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.installedSuccess}
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 p-3",
          state === "installed" && "border-primary/40 bg-primary/5",
        )}
      >
        <span aria-hidden="true" className="text-xl leading-none">
          🧩
        </span>
        <div className="min-w-0 flex-1">
          {state === "needs-provider" && (
            <p className="text-sm text-muted-foreground">
              {labels.waitingProvider}
            </p>
          )}
          {state === "ready" && (
            <p className="text-sm text-foreground">{labels.ctaInstall}</p>
          )}
          {state === "installed" && (
            <div className="space-y-1">
              <p className="text-sm text-emerald-400">
                {labels.alreadyInstalled}
              </p>
              {deployedUrl && (
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs text-primary underline underline-offset-2"
                >
                  {labels.openSite} ↗
                </a>
              )}
            </div>
          )}
        </div>

        {state === "needs-provider" && (
          <Button type="button" size="sm" disabled>
            {labels.ctaInstall}
          </Button>
        )}
        {state === "ready" && (
          <form action={installAuthUiAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="substepId" value={substepId} />
            <input type="hidden" name="locale" value={locale} />
            <PendingButton
              type="submit"
              size="sm"
              pendingText={labels.installing}
            >
              {labels.ctaInstall}
            </PendingButton>
          </form>
        )}
        {state === "installed" && (
          <span aria-label="installed" className="text-sm text-emerald-400">
            ✓
          </span>
        )}
      </div>
    </section>
  );
}
