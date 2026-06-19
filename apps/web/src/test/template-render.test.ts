// @vitest-environment node
/**
 * 템플릿 렌더 테스트 — 결정론·XSS 안전성.
 * 사용자 값이 HTML로 그대로 새어 나가지 않는지(이스케이프) 기계적으로 차단한다.
 */
import { describe, expect, it } from 'vitest';
import { renderTemplate, getTemplate, templates, contactHref } from '@vibestart/template-catalog';

describe('template render', () => {
  it('escapes HTML in user values (XSS-safe)', () => {
    const tpl = templates[0]!;
    const html = renderTemplate(tpl, { title: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes the title and omits empty optional fields', () => {
    const tpl = getTemplate('intro')!;
    const html = renderTemplate(tpl, { title: 'Jiyeong' });
    expect(html).toContain('Jiyeong');
    expect(html).not.toContain('class="tagline"');
  });

  it('renders provided optional fields', () => {
    const tpl = getTemplate('intro')!;
    const html = renderTemplate(tpl, { title: 'Cafe', tagline: 'Warm coffee' });
    expect(html).toContain('class="tagline"');
    expect(html).toContain('Warm coffee');
  });
});

describe('contact CTA href', () => {
  it('maps phone/email/url to a safe scheme, junk to none', () => {
    expect(contactHref('010-1234-5678')).toBe('tel:01012345678');
    expect(contactHref('예약·문의 010-1234-5678')).toBe('tel:01012345678');
    expect(contactHref('shop@example.com')).toBe('mailto:shop@example.com');
    expect(contactHref('https://example.com/x')).toBe('https://example.com/x');
    expect(contactHref('예약 인스타 @ongi.bakery')).toBe('https://instagram.com/ongi.bakery');
    expect(contactHref('javascript:alert(1)')).toBeNull();
    expect(contactHref('놀러오세요')).toBeNull();
  });

  it('never emits a javascript: href; actionable contact becomes a link', () => {
    const tpl = getTemplate('shop')!;
    const evil = renderTemplate(tpl, { title: 'Cafe', contact: 'javascript:alert(1)' });
    expect(evil).not.toContain('href="javascript:');
    const phone = renderTemplate(tpl, { title: 'Cafe', contact: '010-1234-5678' });
    expect(phone).toContain('href="tel:01012345678"');
  });
});
