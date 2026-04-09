/**
 * Phase 2 — vibestart가 사용자 대신 만들어준 외부 리소스 추적.
 *
 * 마일스톤이 끝날 때마다 만들어진 GitHub repo, Vercel project, Sentry
 * project 등을 project_resources 테이블에 기록한다. 사용자에게 보여줄
 * 링크와 외부 ID, 부가 메타데이터를 함께 저장한다.
 */

import type { OAuthProvider } from './oauth.types';
import type { ProjectId } from './project.types';

export type ResourceType =
  | 'github_repo'
  | 'vercel_project'
  | 'supabase_project'
  | 'google_oauth_keys'
  | 'r2_bucket'
  | 'resend_domain'
  | 'sentry_project'
  | 'domain';

export interface ProjectResource {
  id: string;
  projectId: ProjectId;
  provider: OAuthProvider;
  resourceType: ResourceType;
  /** 외부 서비스에서의 ID (예: GitHub repo full name, Vercel project id) */
  externalId: string;
  /** 사용자에게 보여줄 링크 (대시보드/사이트 URL 등) */
  url: string | null;
  metadata: Record<string, unknown>;
}
