/**
 * VerifyAuthButtonPanel — M2 (마)-6 2단계 verify 단계.
 *
 * Stage 1 (HTTP verify):
 *   사용자가 ClaudeCodePromptCard의 프롬프트대로 Claude Code에게 git pull +
 *   AuthButton 끼워넣기 + git commit/push까지 시킨 뒤, "확인하기" 버튼을
 *   눌러 배포된 사이트 HTML에 `data-auth-button` 속성이 있는지 서버가 검증.
 *   통과 시 supabase_project.metadata.authButtonHttpVerified = true.
 *
 * Stage 2 (사용자 수동 end-to-end 확인):
 *   "버튼이 떴다"만으로는 Supabase 키/Google OAuth redirect/세션 유지 등
 *   end-to-end 정상성을 보장 못 한다. 사용자가 직접 본인 계정으로 한 번
 *   Google 로그인까지 해보고 "가입해봤어요" 버튼을 누르면 markSubstepCompleted
 *   가 호출되고 celebration이 뜬다.
 *
 * 상태:
 *   - waiting-install: (마)-5가 아직 완료 안 됨 → 버튼 비활성
 *   - ready: Stage 1 "확인하기" 버튼 활성 (HTTP verify 대기)
 *   - awaiting-signup-test: Stage 1 통과, Stage 2 사용자 확인 대기
 *   - completed: 두 단계 모두 통과 (celebration 발동)
 */

import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import {
  confirmSignupTestAction,
  verifyAuthButtonAction,
} from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type VerifyAuthButtonPanelState =
  | "waiting-install"
  | "ready"
  | "awaiting-signup-test"
  | "completed";

export interface VerifyAuthButtonPanelLabels {
  title: string;
  description: string;
  ctaVerify: string;
  verifying: string;
  waitingInstall: string;
  verifiedSuccess: string;
  errorMessage: string | null;
  /** Stage 2 — HTTP 통과 후 사용자 수동 확인 문구 */
  stage2Title: string;
  stage2Description: string;
  stage2OpenSite: string;
  stage2CtaConfirm: string;
  stage2Confirming: string;
}

export interface VerifyAuthButtonPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: VerifyAuthButtonPanelState;
  deployedUrl: string | null;
  labels: VerifyAuthButtonPanelLabels;
}

export function VerifyAuthButtonPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  deployedUrl,
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

      {state === "awaiting-signup-test" && (
        <div className="space-y-3">
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            ✅ {labels.verifiedSuccess}
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/5 p-4">
            <p className="mb-1 text-sm font-medium text-foreground">
              {labels.stage2Title}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {labels.stage2Description}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {deployedUrl && (
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {labels.stage2OpenSite} ↗
                </a>
              )}
              <form action={confirmSignupTestAction} className="ml-auto">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="milestoneId" value={milestoneId} />
                <input type="hidden" name="substepId" value={substepId} />
                <input type="hidden" name="locale" value={locale} />
                <PendingButton
                  type="submit"
                  size="sm"
                  pendingText={labels.stage2Confirming}
                >
                  {labels.stage2CtaConfirm}
                </PendingButton>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
