/**
 * Phase 2 — 호스팅/배포(Vercel) 데이터 형태.
 *
 * 어댑터는 Vercel API 응답을 이 타입으로 정규화한다. 다른 호스팅으로
 * 갈아끼울 때도 동일한 형태를 유지한다.
 */

export type DeploymentState =
  | 'queued'
  | 'building'
  | 'ready'
  | 'error'
  | 'canceled';

export interface DeployProject {
  id: string;
  name: string;
  /** 'my-portfolio.vercel.app' 같은 자동 발급 호스트 */
  vercelUrl: string;
  /** 사용자에게 보여줄 1차 프로덕션 URL */
  productionUrl: string;
}

export interface Deployment {
  id: string;
  state: DeploymentState;
  url: string;
  createdAt: string;
}

export interface CreateDeployProjectOptions {
  name: string;
  framework: 'nextjs';
}

export interface LinkRepoOptions {
  fullName: string;
  defaultBranch: string;
}
