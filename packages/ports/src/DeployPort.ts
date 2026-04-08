/**
 * DeployPort — 호스팅과 배포 (Phase 2 1순위 어댑터: Vercel).
 *
 * VcsPort가 만든 저장소를 받아 프로젝트로 등록하고, 환경변수를 주입한 뒤
 * 첫 배포를 트리거한다. 배포 완료까지 폴링하는 책임도 이 포트가 가진다.
 */

import type {
  CreateDeployProjectOptions,
  Deployment,
  DeployProject,
  LinkRepoOptions,
  OAuthExchangeResult,
} from '@vibestart/shared-types';

export interface DeployPort {
  beginAuthorize(state: string, redirectTo: string): Promise<{ url: string }>;

  completeAuthorize(code: string, state: string): Promise<OAuthExchangeResult>;

  createProject(
    accessToken: string,
    opts: CreateDeployProjectOptions,
  ): Promise<DeployProject>;

  linkRepo(
    accessToken: string,
    project: DeployProject,
    repo: LinkRepoOptions,
  ): Promise<void>;

  setEnvVars(
    accessToken: string,
    project: DeployProject,
    vars: Readonly<Record<string, string>>,
  ): Promise<void>;

  triggerDeployment(
    accessToken: string,
    project: DeployProject,
  ): Promise<Deployment>;

  /**
   * 배포가 ready/error/canceled 상태에 도달할 때까지 폴링한다.
   * 호출자(도메인)는 이 메서드가 끝났을 때 마일스톤 진행을 다음 단계로 옮긴다.
   */
  waitForDeployment(
    accessToken: string,
    project: DeployProject,
    deploymentId: string,
  ): Promise<Deployment>;
}
