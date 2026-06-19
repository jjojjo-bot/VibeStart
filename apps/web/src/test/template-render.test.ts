// @vitest-environment node
/**
 * 템플릿 렌더 테스트 — 결정론·XSS 안전성.
 * 사용자 값이 HTML로 그대로 새어 나가지 않는지(이스케이프) 기계적으로 차단한다.
 */
import { describe, expect, it } from 'vitest';
import { renderTemplate, getTemplate, templates } from '@vibestart/template-catalog';

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
