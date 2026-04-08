/**
 * Substep ID → OAuthProvider 매핑.
 *
 * Phase 2a의 substep id 컨벤션(`m{N}-s{M}-{provider}-oauth`)에서 provider를
 * 추출한다. Phase 2b에서 Substep 타입에 provider 필드가 정식으로 추가되면
 * 이 헬퍼는 제거하고 s.provider를 직접 사용한다.
 */

import type { OAuthProvider } from "@vibestart/shared-types";

const SUFFIX_TO_PROVIDER: Record<string, OAuthProvider> = {
  "github-oauth": "github",
  "vercel-oauth": "vercel",
  "supabase-oauth": "supabase_mgmt",
  "sentry-oauth": "sentry",
  "cloudflare-oauth": "cloudflare",
};

export function providerFromSubstepId(substepId: string): OAuthProvider | null {
  for (const [suffix, provider] of Object.entries(SUFFIX_TO_PROVIDER)) {
    if (substepId.endsWith(suffix)) return provider;
  }
  return null;
}

/**
 * Phase 2a (라)-1에서 실제로 구현된 provider들. 나머지는 UI에 "곧 제공"으로.
 */
export const SUPPORTED_PROVIDERS: ReadonlySet<OAuthProvider> = new Set<OAuthProvider>([
  "github",
]);

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  github: "GitHub",
  vercel: "Vercel",
  supabase_mgmt: "Supabase",
  cloudflare: "Cloudflare",
  resend: "Resend",
  sentry: "Sentry",
};

export function providerLabel(provider: OAuthProvider): string {
  return PROVIDER_LABEL[provider];
}
