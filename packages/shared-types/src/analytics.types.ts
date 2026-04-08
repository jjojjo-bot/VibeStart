/**
 * Phase 2 — 분석(Vercel Analytics + GA4) 데이터 형태.
 *
 * GA4는 Google Cloud Console에서 사용자가 직접 측정 ID를 만들어야 한다.
 * vibestart는 그 ID를 받아 next/script로 layout.tsx에 자동 삽입한다.
 */

export interface Ga4Snippet {
  /** 삽입할 코드 (next/script 컴포넌트 형태) */
  code: string;
  /** 코드를 어느 파일에 삽입해야 하는지 */
  insertPath: string;
}
