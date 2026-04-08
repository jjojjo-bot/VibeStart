/**
 * AnalyticsPort — 사이트 방문 분석 (Vercel Web Analytics + GA4).
 *
 * M3 마일스톤. Vercel Analytics는 OAuth로 활성화 가능하지만 GA4는
 * Google Cloud Console에서 사용자가 직접 측정 ID를 만들어야 한다.
 * 그 ID를 받아 next/script 컴포넌트 형태로 layout.tsx에 자동 삽입한다.
 */

import type { Ga4Snippet } from '@vibestart/shared-types';

export interface AnalyticsPort {
  /**
   * Vercel Web Analytics를 프로젝트에 활성화한다 (Vercel API 호출).
   */
  enableVercelAnalytics(
    accessToken: string,
    deployProjectId: string,
  ): Promise<void>;

  /**
   * GA4 측정 ID를 받아 layout.tsx에 삽입할 next/script 코드와 경로를 생성한다.
   * 실제 파일 쓰기는 IdeBridgePort가 담당한다.
   */
  generateGa4Snippet(measurementId: string): Promise<Ga4Snippet>;
}
