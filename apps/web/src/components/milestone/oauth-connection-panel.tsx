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
import { cn } from "@/lib/utils";

import { connectGitHubAction } from "@/app/[locale]/projects/[id]/m/[milestoneId]/actions";

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
  title: string;
  connectButton: string;
  comingSoon: string;
  successMessage: string | null;
  errorMessage: string | null;
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
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        {labels.title}
      </h2>

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
              "flex items-center gap-3 rounded-md border border-border bg-background/40 p-3",
              row.connected && "border-primary/40 bg-primary/5",
            )}
            data-provider={row.provider}
            data-connected={row.connected}
          >
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
              <span
                aria-label="connected"
                className="text-sm text-emerald-400"
              >
                ✓
              </span>
            ) : !row.supported ? (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {labels.comingSoon}
              </span>
            ) : row.provider === "github" ? (
              <form action={connectGitHubAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="milestoneId" value={milestoneId} />
                <input type="hidden" name="substepId" value={row.substepId} />
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit" size="sm">
                  {labels.connectButton}
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
