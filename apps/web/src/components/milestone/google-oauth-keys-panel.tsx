"use client";

/**
 * GoogleOAuthKeysPanel — M2 (마)-3 m2-s3-google-oauth-keys.
 *
 * user-action kind의 첫 사례. Google Cloud Console은 OAuth 클라이언트 생성을
 * API로 지원하지 않기 때문에 사용자가 수동으로 만들어야 한다. 이 패널은
 * 사용자의 수동 작업을 최대한 쉽게 만들어주는 가이드 역할:
 *
 *   1. "Google Cloud Console 열기" 버튼으로 외부 페이지 이동
 *   2. Supabase 프로젝트의 redirect URI를 복사 버튼으로 제공 (붙여넣기 실수 방지)
 *   3. 발급받은 client_id / client_secret을 폼으로 저장
 *
 * 클라이언트 컴포넌트인 이유: navigator.clipboard API로 복사 상태 토글.
 * 저장은 saveGoogleOAuthKeysAction 서버 액션으로 처리. 선행 조건으로 m2-s2가
 * 완료되어 redirect URI를 계산할 수 있어야 함.
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import {
  resetGoogleOAuthKeysAction,
  saveGoogleOAuthKeysAction,
} from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export type GoogleOAuthKeysPanelState =
  | "waiting-supabase"
  | "ready"
  | "saved";

export interface GoogleOAuthKeysPanelLabels {
  title: string;
  description: string;
  waitingSupabase: string;
  step1Label: string;
  externalLinkCta: string;
  step1Details?: string[];
  step2Label: string;
  redirectUriLabel: string;
  redirectUriHelp: string;
  copyButton: string;
  copiedLabel: string;
  step3Label: string;
  clientIdLabel: string;
  clientIdPlaceholder: string;
  clientSecretLabel: string;
  clientSecretPlaceholder: string;
  ctaSave: string;
  saving: string;
  savedSuccess: string | null;
  alreadySaved: string | null;
  errorMessage: string | null;
  /** 수정 완료 같은 중립 정보 메시지 (어떤 state에서도 표시). */
  noticeMessage: string | null;
  /** saved 상태에서 마스킹된 client_id 위에 붙는 레이블 */
  savedClientIdLabel: string;
  /** "수정하기" 버튼 레이블 */
  editButton: string;
  /** 수정 중 pending 상태 텍스트 */
  resetting: string;
}

export interface GoogleOAuthKeysPanelProps {
  projectId: string;
  milestoneId: string;
  substepId: string;
  locale: string;
  state: GoogleOAuthKeysPanelState;
  /** `https://{ref}.supabase.co/auth/v1/callback`. state=waiting-supabase일 땐 null. */
  redirectUri: string | null;
  /** Google Cloud Console Credentials 페이지 URL. */
  externalUrl: string;
  /**
   * saved 상태일 때 화면에 보여줄 마스킹된 clientId.
   * 서버가 `000000000000-xxx****.apps.googleusercontent.com` 형태로 가공한 값을 전달.
   * state !== "saved"면 null.
   */
  savedClientIdMasked: string | null;
  labels: GoogleOAuthKeysPanelLabels;
}

export function GoogleOAuthKeysPanel({
  projectId,
  milestoneId,
  substepId,
  locale,
  state,
  redirectUri,
  externalUrl,
  savedClientIdMasked,
  labels,
}: GoogleOAuthKeysPanelProps): React.ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    if (!redirectUri) return;
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 실패 시 조용히 무시 — 사용자가 수동 선택 가능
    }
  };

  return (
    <section
      className="mb-8 rounded-lg border border-border bg-card p-5"
      data-testid="google-oauth-keys-panel"
      data-state={state}
    >
      <h2 className="mb-1 text-sm font-medium text-muted-foreground">
        {labels.title}
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">{labels.description}</p>

      {labels.errorMessage && (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          ⚠️ {labels.errorMessage}
        </div>
      )}
      {labels.noticeMessage && (
        <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          ℹ️ {labels.noticeMessage}
        </div>
      )}

      {state === "saved" && labels.savedSuccess && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.savedSuccess}
        </div>
      )}
      {state === "saved" && !labels.savedSuccess && labels.alreadySaved && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.alreadySaved}
        </div>
      )}

      {state === "waiting-supabase" && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-3">
          <span aria-hidden="true" className="text-xl leading-none">
            🔑
          </span>
          <p className="text-sm text-muted-foreground">
            {labels.waitingSupabase}
          </p>
        </div>
      )}

      {state === "ready" && (
        <div className="space-y-4">
          {/* Step 1: Google Cloud Console 열기 + 상세 안내 */}
          <div className="rounded-md border border-border bg-background/40 p-3">
            <p className="mb-2 text-xs font-medium text-foreground">
              <span className="text-muted-foreground">1.</span>{" "}
              {labels.step1Label}
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
            >
              {labels.externalLinkCta} ↗
            </a>
            {labels.step1Details && labels.step1Details.length > 0 && (
              <ol className="mt-2 space-y-1.5 border-t border-border/50 pt-2">
                {labels.step1Details.map((detail, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs text-muted-foreground"
                  >
                    <span className="shrink-0 text-primary/60">
                      {String.fromCharCode(9312 + i)}
                    </span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Step 2: Redirect URI 복사 */}
          {redirectUri && (
            <div className="rounded-md border border-border bg-background/40 p-3">
              <p className="mb-2 text-xs font-medium text-foreground">
                <span className="text-muted-foreground">2.</span>{" "}
                {labels.step2Label}
              </p>
              <p className="mb-2 text-xs text-muted-foreground">
                {labels.redirectUriHelp}
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded border border-border bg-muted px-2 py-1.5 font-mono text-xs">
                  {redirectUri}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  aria-label={labels.copyButton}
                  className={cn(
                    "shrink-0 transition-colors",
                    copied && "border-emerald-500/60 text-emerald-400",
                  )}
                >
                  {copied ? `✓ ${labels.copiedLabel}` : labels.copyButton}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: client_id / client_secret 입력 */}
          <form
            action={saveGoogleOAuthKeysAction}
            className="rounded-md border border-border bg-background/40 p-3"
          >
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="substepId" value={substepId} />
            <input type="hidden" name="locale" value={locale} />

            <p className="mb-3 text-xs font-medium text-foreground">
              <span className="text-muted-foreground">3.</span>{" "}
              {labels.step3Label}
            </p>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">
                  {labels.clientIdLabel}
                </span>
                <input
                  type="text"
                  name="clientId"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  placeholder={labels.clientIdPlaceholder}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-xs"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">
                  {labels.clientSecretLabel}
                </span>
                <input
                  type="password"
                  name="clientSecret"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  placeholder={labels.clientSecretPlaceholder}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-xs"
                />
              </label>

              <div className="flex justify-end">
                <PendingButton
                  type="submit"
                  size="sm"
                  pendingText={labels.saving}
                >
                  {labels.ctaSave}
                </PendingButton>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* saved 상태: 마스킹된 clientId + 수정하기 버튼 */}
      {state === "saved" && (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
          <div className="mb-2 text-xs text-muted-foreground">
            {labels.savedClientIdLabel}
          </div>
          <div className="flex items-center gap-3">
            <code className="min-w-0 flex-1 truncate rounded border border-border bg-muted px-2 py-1.5 font-mono text-xs">
              {savedClientIdMasked ?? "•••"}
            </code>
            <form action={resetGoogleOAuthKeysAction} className="shrink-0">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="milestoneId" value={milestoneId} />
              <input type="hidden" name="substepId" value={substepId} />
              <input type="hidden" name="locale" value={locale} />
              <PendingButton
                type="submit"
                size="sm"
                variant="outline"
                pendingText={labels.resetting}
              >
                {labels.editButton}
              </PendingButton>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
