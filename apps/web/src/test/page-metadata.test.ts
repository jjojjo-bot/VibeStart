// @vitest-environment node
/**
 * createPageMetadata — 하위 마케팅 페이지(onboarding/plan/setup/complete/about/terms/privacy)가
 * 자기 자신을 가리키는 canonical을 갖는지 검증.
 *
 * 기존엔 title/description만 줘서 루트 레이아웃의 로케일-루트 canonical을 상속 →
 * 모든 페이지가 "홈"을 가리켜 Lighthouse SEO `rel=canonical`이 깨졌다.
 */
import { describe, expect, it, vi } from 'vitest';

// getTranslations는 요청 컨텍스트가 필요하므로 키를 그대로 반환하도록 모킹(여기선
// canonical/hreflang만 검증, 텍스트는 무관).
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

import { createPageMetadata } from '@/lib/page-metadata';

describe('createPageMetadata', () => {
  it('sets a self-canonical per page+locale (ko=루트, 그 외=프리픽스)', async () => {
    expect((await createPageMetadata('ko', 'about')).alternates?.canonical).toBe(
      'https://vibe-start.com/about',
    );
    expect((await createPageMetadata('en', 'about')).alternates?.canonical).toBe(
      'https://vibe-start.com/en/about',
    );
    expect((await createPageMetadata('ja', 'terms')).alternates?.canonical).toBe(
      'https://vibe-start.com/ja/terms',
    );
    expect((await createPageMetadata('ko', 'privacy')).alternates?.canonical).toBe(
      'https://vibe-start.com/privacy',
    );
  });

  it('includes hreflang languages for the page path', async () => {
    const langs = (await createPageMetadata('ko', 'plan')).alternates?.languages as Record<
      string,
      string
    >;
    expect(langs.ko).toBe('https://vibe-start.com/plan');
    expect(langs.en).toBe('https://vibe-start.com/en/plan');
    expect(langs['x-default']).toBe('https://vibe-start.com/plan');
  });
});
