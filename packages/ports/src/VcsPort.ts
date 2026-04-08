/**
 * VcsPort — 코드 저장소 (Phase 2 1순위 어댑터: GitHub).
 *
 * Phase 2의 M1 마일스톤("인터넷에 내 사이트가 뜬다")의 첫 단계이며,
 * 이 포트가 만든 저장소 URL을 DeployPort가 받아 호스팅에 연결한다.
 */

import type {
  CreateRepoOptions,
  OAuthExchangeResult,
  VcsRepo,
} from '@vibestart/shared-types';

export interface VcsPort {
  /**
   * OAuth authorize URL 생성. state는 CSRF 방지용.
   */
  beginAuthorize(state: string, redirectTo: string): Promise<{ url: string }>;

  /**
   * OAuth 콜백에서 받은 코드를 토큰으로 교환한다.
   * 반환된 토큰은 즉시 Vault에 저장되어야 하며, 호출자 외에 노출되지 않는다.
   */
  completeAuthorize(code: string, state: string): Promise<OAuthExchangeResult>;

  /**
   * 인증된 사용자 명의로 새 저장소를 만든다.
   */
  createRepo(accessToken: string, opts: CreateRepoOptions): Promise<VcsRepo>;

  /**
   * 저장소에 협업자를 추가한다 (Phase 2c — 팀 기능에 사용 예정).
   */
  ensureCollaborator(
    accessToken: string,
    repo: VcsRepo,
    username: string,
  ): Promise<void>;
}
