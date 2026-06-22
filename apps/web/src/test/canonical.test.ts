// @vitest-environment node
/**
 * 페이지별 canonical/hreflang 빌더 검증.
 *
 * 루트 [locale]/layout.tsx는 로케일 루트(localeUrl)만 canonical로 준다 — 하위
 * 라우트(/start 등)는 이를 상속해 "홈"을 가리키게 되어 Lighthouse SEO의
 * `rel=canonical` 감사가 깨진다. 페이지는 자기 자신을 가리키는 canonical과
 * 로케일별 hreflang을 가져야 한다.
 */
import { describe, expect, it } from 'vitest';
import { pageAlternates } from '@/lib/canonical';

describe('pageAlternates', () => {
  it('builds a self-canonical for the page path per locale (ko=루트, 그 외=프리픽스)', () => {
    expect(pageAlternates('ko', 'start').canonical).toBe('https://vibe-start.com/start');
    expect(pageAlternates('en', 'start').canonical).toBe('https://vibe-start.com/en/start');
  });

  it('includes hreflang languages for every locale plus x-default', () => {
    const { languages } = pageAlternates('ko', 'start');
    expect(languages.ko).toBe('https://vibe-start.com/start');
    expect(languages.en).toBe('https://vibe-start.com/en/start');
    expect(languages.ja).toBe('https://vibe-start.com/ja/start');
    expect(languages['x-default']).toBe('https://vibe-start.com/start');
  });

  it('normalizes a leading slash in the path', () => {
    expect(pageAlternates('ko', '/start').canonical).toBe('https://vibe-start.com/start');
  });
});
