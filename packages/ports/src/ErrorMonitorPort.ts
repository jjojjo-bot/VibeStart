/**
 * ErrorMonitorPort — 에러 추적 (Phase 2 1순위 어댑터: Sentry).
 *
 * M4 마일스톤. 프로젝트 생성 후 받은 DSN은 DeployPort.setEnvVars로
 * NEXT_PUBLIC_SENTRY_DSN에 자동 등록된다.
 */

import type {
  CreateMonitorProjectOptions,
  MonitorProject,
  OAuthExchangeResult,
} from '@vibestart/shared-types';

export interface ErrorMonitorPort {
  beginAuthorize(state: string, redirectTo: string): Promise<{ url: string }>;

  completeAuthorize(code: string, state: string): Promise<OAuthExchangeResult>;

  createProject(
    accessToken: string,
    orgSlug: string,
    opts: CreateMonitorProjectOptions,
  ): Promise<MonitorProject>;
}
