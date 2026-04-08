/**
 * Phase 2 — 에러 모니터링(Sentry) 데이터 형태.
 */

export interface MonitorProject {
  id: string;
  slug: string;
  /** Sentry DSN — 클라이언트가 에러를 보내는 엔드포인트 */
  dsn: string;
}

export interface CreateMonitorProjectOptions {
  name: string;
  platform: 'javascript-nextjs';
}
