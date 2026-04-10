/**
 * EnableGoogleProviderPanel — M2 (마)-4 자동 단계.
 *
 * Supabase 프로젝트에 Google OAuth provider를 활성화한다. CreateSupabaseProjectPanel과
 * 동일한 auto kind 패턴 (단일 버튼 + pending/success/error 토스트).
 *
 * 상태 머신:
 *   - needs-supabase: (마)-2 supabase_project 리소스 없음
 *   - needs-keys: (마)-3 google_oauth_keys 리소스 없음
 *   - ready: 두 선행 조건 모두 충족, 활성화 버튼 활성
 *   - enabled: 이미 활성화 완료
 */

import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import { enableGoogleProviderAction } from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type EnableGoogleProviderPanelState =
  | "needs-supabase"
  | "needs-keys"
  | "ready"
  | "enabled";

export interface EnableGoogleProviderPanelLabels {
  title: string;
  description: string;
  ctaEnable: string;
  enabling: string;
  waitingSupabase: string;
  waitingKeys: string;
  enabledSuccess: string | null;
  alreadyEnabled: string;
  errorMessage: string | null;
}

export interface EnableGoogleProviderPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: EnableGoogleProviderPanelState;
  labels: EnableGoogleProviderPanelLabels;
}

export function EnableGoogleProviderPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  labels,
}: EnableGoogleProviderPanelProps): React.ReactNode {
  return (
    <section
      className="mb-8 rounded-lg border border-border bg-card p-5"
      data-testid="enable-google-provider-panel"
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

      {state === "enabled" && labels.enabledSuccess && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.enabledSuccess}
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 p-3",
          state === "enabled" && "border-primary/40 bg-primary/5",
        )}
      >
        <span aria-hidden="true" className="text-xl leading-none">
          🔐
        </span>
        <div className="min-w-0 flex-1">
          {state === "needs-supabase" && (
            <p className="text-sm text-muted-foreground">
              {labels.waitingSupabase}
            </p>
          )}
          {state === "needs-keys" && (
            <p className="text-sm text-muted-foreground">
              {labels.waitingKeys}
            </p>
          )}
          {state === "ready" && (
            <p className="text-sm text-foreground">{labels.ctaEnable}</p>
          )}
          {state === "enabled" && (
            <p className="text-sm text-emerald-400">{labels.alreadyEnabled}</p>
          )}
        </div>

        {(state === "needs-supabase" || state === "needs-keys") && (
          <Button type="button" size="sm" disabled>
            {labels.ctaEnable}
          </Button>
        )}
        {state === "ready" && (
          <form action={enableGoogleProviderAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="substepId" value={substepId} />
            <input type="hidden" name="locale" value={locale} />
            <PendingButton
              type="submit"
              size="sm"
              pendingText={labels.enabling}
            >
              {labels.ctaEnable}
            </PendingButton>
          </form>
        )}
        {state === "enabled" && (
          <span aria-label="enabled" className="text-sm text-emerald-400">
            ✓
          </span>
        )}
      </div>
    </section>
  );
}
