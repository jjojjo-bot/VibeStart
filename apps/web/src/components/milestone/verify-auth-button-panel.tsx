/**
 * VerifyAuthButtonPanel — M2 (마)-6 verify 단계.
 *
 * 사용자가 ClaudeCodePromptCard의 프롬프트대로 Claude Code에게 git pull +
 * AuthButton 끼워넣기 + git commit/push까지 시킨 뒤, "확인하기" 버튼을
 * 눌러 배포된 사이트 HTML에 `data-auth-button` 속성이 있는지 서버가 검증한다.
 *
 * 상태:
 *   - waiting-install: (마)-5가 아직 완료 안 됨 → 버튼 비활성
 *   - ready: 확인 버튼 활성
 *   - completed: 이미 검증 통과 (celebration이 뜸)
 */

import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import { verifyAuthButtonAction } from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type VerifyAuthButtonPanelState =
  | "waiting-install"
  | "ready"
  | "completed";

export interface VerifyAuthButtonPanelLabels {
  title: string;
  description: string;
  ctaVerify: string;
  verifying: string;
  waitingInstall: string;
  verifiedSuccess: string;
  errorMessage: string | null;
}

export interface VerifyAuthButtonPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: VerifyAuthButtonPanelState;
  labels: VerifyAuthButtonPanelLabels;
}

export function VerifyAuthButtonPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  labels,
}: VerifyAuthButtonPanelProps): React.ReactNode {
  return (
    <section
      className={cn(
        "mb-8 rounded-lg border border-border bg-card p-5",
        state === "completed" && "border-primary/40 bg-primary/5",
      )}
      data-testid="verify-auth-button-panel"
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

      {state === "completed" && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.verifiedSuccess}
        </div>
      )}

      {state === "waiting-install" && (
        <div className="rounded-md border border-border bg-background/40 p-3 text-sm text-muted-foreground">
          {labels.waitingInstall}
        </div>
      )}

      {state === "ready" && (
        <form action={verifyAuthButtonAction} className="flex justify-end">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="milestoneId" value={milestoneId} />
          <input type="hidden" name="substepId" value={substepId} />
          <input type="hidden" name="locale" value={locale} />
          <PendingButton type="submit" size="sm" pendingText={labels.verifying}>
            {labels.ctaVerify}
          </PendingButton>
        </form>
      )}
    </section>
  );
}
