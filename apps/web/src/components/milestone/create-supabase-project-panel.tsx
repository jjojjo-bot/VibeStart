/**
 * CreateSupabaseProjectPanel — M2 마일스톤의 Supabase 프로젝트 자동 생성 패널.
 *
 * CreateRepoPanel/DeployPanel과 동일한 패턴. createSupabaseProjectAction을
 * <form action>으로 호출. 선행 조건: Supabase OAuth 연결.
 */

import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import { createSupabaseProjectAction } from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type CreateSupabaseProjectPanelState =
  | "needs-oauth"
  | "ready"
  | "created";

export interface CreateSupabaseProjectPanelLabels {
  title: string;
  description: string;
  ctaCreate: string;
  creating: string;
  waitingOauth: string;
  createdSuccess: string | null;
  alreadyExists: string | null;
  openDashboard: string;
  errorMessage: string | null;
}

export interface CreateSupabaseProjectPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: CreateSupabaseProjectPanelState;
  dashboardUrl: string | null;
  labels: CreateSupabaseProjectPanelLabels;
}

export function CreateSupabaseProjectPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  dashboardUrl,
  labels,
}: CreateSupabaseProjectPanelProps): React.ReactNode {
  return (
    <section
      className="mb-8 rounded-lg border border-border bg-card p-5"
      data-testid="create-supabase-project-panel"
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
          🗄️
        </span>
        <div className="min-w-0 flex-1">
          {state === "needs-oauth" && (
            <p className="text-sm text-muted-foreground">
              {labels.waitingOauth}
            </p>
          )}
          {state === "ready" && (
            <p className="text-sm text-foreground">{labels.ctaCreate}</p>
          )}
          {state === "created" && dashboardUrl && (
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-2"
            >
              {labels.openDashboard} ↗
            </a>
          )}
        </div>

        {state === "needs-oauth" && (
          <Button type="button" size="sm" disabled>
            {labels.ctaCreate}
          </Button>
        )}
        {state === "ready" && (
          <form action={createSupabaseProjectAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="substepId" value={substepId} />
            <input type="hidden" name="locale" value={locale} />
            <PendingButton
              type="submit"
              size="sm"
              pendingText={labels.creating}
            >
              {labels.ctaCreate}
            </PendingButton>
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
