import type { ReactNode } from 'react';
// liquid-glass 디자인 시스템 — 이 라우트 세그먼트(/start)에만 로드되어
// 사이트 전역 테마와 충돌하지 않는다(Next App Router의 라우트 단위 CSS 로딩).
import '@/styles/liquid-glass.css';

export default function StartLayout({ children }: { children: ReactNode }) {
  return children;
}
