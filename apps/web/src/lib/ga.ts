/**
 * Google Analytics 이벤트 유틸.
 *
 * 퍼널 추적용 커스텀 이벤트를 GA4로 전송한다.
 * gtag가 로드되지 않은 환경(SSR, 테스트)에서는 조용히 무시한다.
 */

type GtagEvent = {
  action: string;
  params?: Record<string, string | number>;
};

function gtag(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...(args as Parameters<typeof window.gtag>));
  }
}

export function trackEvent({ action, params }: GtagEvent): void {
  gtag("event", action, params);
}

/* ── 퍼널 이벤트 ── */

export function trackOnboardingStart(os: string): void {
  trackEvent({ action: "onboarding_start", params: { os } });
}

export function trackOnboardingComplete(os: string, goal: string): void {
  trackEvent({ action: "onboarding_complete", params: { os, goal } });
}

export function trackSetupStart(os: string, goal: string): void {
  trackEvent({ action: "setup_start", params: { os, goal } });
}

export function trackSetupComplete(os: string, goal: string): void {
  trackEvent({ action: "setup_complete", params: { os, goal } });
}

export function trackPhase2Login(): void {
  trackEvent({ action: "phase2_login" });
}

export function trackProjectCreate(track: string): void {
  trackEvent({ action: "project_create", params: { track } });
}
