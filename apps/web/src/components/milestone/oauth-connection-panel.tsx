/**
 * OAuth 연결 관리 패널 — 마일스톤 상세 페이지 상단에 배치.
 *
 * 현재 마일스톤의 oauth kind 서브스텝마다 한 행씩 표시하며, 연결 상태에
 * 따라 "연결하기" 버튼 또는 "@username 연결됨" 표시. Phase 2a (라)-1에서
 * 실제 동작하는 provider는 GitHub뿐이고 나머지는 "곧 제공" 뱃지.
 *
 * 각 "연결하기" 버튼은 연관된 Server Action을 호출하는 form이다. Action이
 * signed state cookie를 설정하고 provider authorize URL로 redirect한다.
 */

import type { OAuthProvider } from "@vibestart/shared-types";

import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

import {
  connectGitHubAction,
  connectSupabaseAction,
  connectVercelAction,
} from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

export interface OAuthConnectionRow {
  substepId: string;
  provider: OAuthProvider;
  providerLabel: string;
  connected: boolean;
  /**
   * 서버에서 pre-formatted된 "Connected as @foo" 문자열. connected=true일 때만 제공.
   * next-intl v4가 호출 시점에 placeholder 값을 요구하므로 row 루프에서 해석해서 전달.
   */
  connectedLabel: string | null;
  supported: boolean;
}

export interface OAuthConnectionPanelLabels {
  /** null이면 섹션 제목을 렌더하지 않는다 (단일 row 패널 등). */
  title: string | null;
  connectButton: string;
  comingSoon: string;
  successMessage: string | null;
  errorMessage: string | null;
  /** 버튼 pending 상태 텍스트 ("연결 중...") */
  connecting: string;
  /** 재연결 버튼 텍스트 ("재연결") */
  reconnectButton: string;
  /** Vercel PAT 입력 폼 라벨들. (라)-3에서 추가. */
  vercelHelperText: string;
  vercelHelperLink: string;
  vercelTokenPlaceholder: string;
  vercelConnectButton: string;
  /** Vercel 계정에 GitHub 연결이 필수라는 경고 배너. (이슈 5 레이어 1) */
  vercelGithubWarningTitle: string;
  vercelGithubWarningBody: string;
  vercelGithubWarningCta: string;
  /** Provider별 가입 가이드. 연결 안 된 상태에서만 표시. */
  signupGuideGithub: string;
  signupGuideVercel: string;
  signupGuideSupabase: string;
}

export interface OAuthConnectionPanelProps {
  rows: ReadonlyArray<OAuthConnectionRow>;
  projectId: string;
  milestoneId: string;
  locale: string;
  labels: OAuthConnectionPanelLabels;
}

const PROVIDER_EMOJI: Record<OAuthProvider, string> = {
  github: "🐙",
  vercel: "▲",
  supabase_mgmt: "⚡",
  google: "🔑",
  cloudflare: "☁️",
  resend: "📧",
  sentry: "🛡️",
};

export function OAuthConnectionPanel({
  rows,
  projectId,
  milestoneId,
  locale,
  labels,
}: OAuthConnectionPanelProps): React.ReactNode {
  if (rows.length === 0) return null;

  return (
    <section className="mb-8 rounded-lg border border-border bg-card p-5">
      {labels.title && (
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {labels.title}
        </h2>
      )}

      {labels.successMessage && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✅ {labels.successMessage}
        </div>
      )}
      {labels.errorMessage && (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          ⚠️ {labels.errorMessage}
        </div>
      )}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.substepId}
            className={cn(
              "rounded-md border border-border bg-background/40 p-3",
              row.connected && "border-primary/40 bg-primary/5",
            )}
            data-provider={row.provider}
            data-connected={row.connected}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-xl leading-none">
                {PROVIDER_EMOJI[row.provider]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{row.providerLabel}</div>
                {row.connected && row.connectedLabel && (
                  <div className="text-xs text-muted-foreground">
                    {row.connectedLabel}
                  </div>
                )}
              </div>
              {row.connected ? (
                <div className="flex items-center gap-2">
                  <span
                    aria-label="connected"
                    className="text-sm text-emerald-400"
                  >
                    ✓
                  </span>
                  {row.supported && (row.provider === "github" || row.provider === "supabase_mgmt") && (
                    <form action={row.provider === "github" ? connectGitHubAction : connectSupabaseAction}>
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="milestoneId" value={milestoneId} />
                      <input type="hidden" name="substepId" value={row.substepId} />
                      <input type="hidden" name="locale" value={locale} />
                      <PendingButton
                        type="submit"
                        size="sm"
                        variant="ghost"
                        pendingText={labels.connecting}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {labels.reconnectButton}
                      </PendingButton>
                    </form>
                  )}
                </div>
              ) : !row.supported ? (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {labels.comingSoon}
                </span>
              ) : row.provider === "github" ? (
                <form action={connectGitHubAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input
                    type="hidden"
                    name="milestoneId"
                    value={milestoneId}
                  />
                  <input
                    type="hidden"
                    name="substepId"
                    value={row.substepId}
                  />
                  <input type="hidden" name="locale" value={locale} />
                  <PendingButton
                    type="submit"
                    size="sm"
                    pendingText={labels.connecting}
                  >
                    {labels.connectButton}
                  </PendingButton>
                </form>
              ) : row.provider === "supabase_mgmt" ? (
                <form action={connectSupabaseAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input
                    type="hidden"
                    name="milestoneId"
                    value={milestoneId}
                  />
                  <input
                    type="hidden"
                    name="substepId"
                    value={row.substepId}
                  />
                  <input type="hidden" name="locale" value={locale} />
                  <PendingButton
                    type="submit"
                    size="sm"
                    pendingText={labels.connecting}
                  >
                    {labels.connectButton}
                  </PendingButton>
                </form>
              ) : null}
            </div>

            {/* Vercel은 토큰 입력창이 필요해 row 아래쪽에 별도 form 영역 */}
            {!row.connected &&
              row.supported &&
              row.provider === "vercel" && (
                <form
                  action={connectVercelAction}
                  className="mt-3 flex flex-col gap-2"
                >
                  <input type="hidden" name="projectId" value={projectId} />
                  <input
                    type="hidden"
                    name="milestoneId"
                    value={milestoneId}
                  />
                  <input
                    type="hidden"
                    name="substepId"
                    value={row.substepId}
                  />
                  <input type="hidden" name="locale" value={locale} />
                  {/* 이슈 5 레이어 1 — GitHub 미연결 Vercel 계정 예방 배너 */}
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                    <p className="font-medium text-amber-300">
                      ⚠️ {labels.vercelGithubWarningTitle}
                    </p>
                    <p className="mt-1 text-amber-200/90">
                      {labels.vercelGithubWarningBody}
                    </p>
                    <a
                      href="https://vercel.com/account/login-connections"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-amber-300 underline underline-offset-2 hover:text-amber-200"
                    >
                      {labels.vercelGithubWarningCta} ↗
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {labels.signupGuideVercel}{" "}
                    <a
                      href="https://vercel.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      Vercel ↗
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {labels.vercelHelperText}{" "}
                    <a
                      href="https://vercel.com/account/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {labels.vercelHelperLink} ↗
                    </a>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      name="vercelToken"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={labels.vercelTokenPlaceholder}
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono"
                    />
                    <PendingButton
                      type="submit"
                      size="sm"
                      pendingText={labels.connecting}
                    >
                      {labels.vercelConnectButton}
                    </PendingButton>
                  </div>
                </form>
              )}

            {/* 가입 가이드 — 연결 안 된 provider에만 표시 */}
            {!row.connected && row.supported && row.provider === "github" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {labels.signupGuideGithub}{" "}
                <a
                  href="https://github.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  GitHub ↗
                </a>
              </p>
            )}
            {!row.connected && row.supported && row.provider === "supabase_mgmt" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {labels.signupGuideSupabase}{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Supabase ↗
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
