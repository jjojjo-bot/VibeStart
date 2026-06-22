// @vitest-environment node
/**
 * 템플릿 렌더 테스트 — 결정론·XSS 안전성.
 * 사용자 값이 HTML로 그대로 새어 나가지 않는지(이스케이프) 기계적으로 차단한다.
 */
import { describe, expect, it } from 'vitest';
import {
  renderTemplate,
  getTemplate,
  templates,
  contactHref,
  DEFAULT_PREVIEW_LABELS,
} from '@vibestart/template-catalog';

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
    expect(html).not.toContain('class="role"');
  });

  it('renders provided optional fields', () => {
    const tpl = getTemplate('intro')!;
    const html = renderTemplate(tpl, { title: 'Cafe', tagline: 'Warm coffee' });
    expect(html).toContain('class="role"');
    expect(html).toContain('Warm coffee');
  });
});

describe('catalog shape (todo → launch 교체 완료)', () => {
  it('exposes intro/shop/launch/invitation and no todo', () => {
    expect(templates.map((t) => t.id)).toEqual(['intro', 'shop', 'launch', 'invitation']);
    expect(getTemplate('launch')).toBeDefined();
    expect(getTemplate('todo')).toBeUndefined();
  });
});

describe('shop preview (메뉴·영업시간·오시는 길 와이어업)', () => {
  const tpl = getTemplate('shop')!;
  it('renders menu rows, hours and location from their own fields', () => {
    const html = renderTemplate(tpl, {
      title: 'Cafe',
      menu: '아메리카노 | 진한 싱글 오리진 | 4,500',
      hours: '화–일 10:00–19:00',
      location: '서울 골목 12-3',
    });
    expect(html).toContain('아메리카노');
    expect(html).toContain('4,500');
    expect(html).toContain('화–일 10:00–19:00');
    expect(html).toContain('서울 골목 12-3');
  });

  it('uses injected locale labels, not hardcoded Korean', () => {
    const labels = { ...DEFAULT_PREVIEW_LABELS, lang: 'en', menu: 'Menu', hours: 'Hours' };
    const html = renderTemplate(tpl, { title: 'Cafe', menu: 'Latte | x | 5', hours: '9–6' }, labels);
    expect(html).toContain('<h2>Menu</h2>');
    expect(html).toContain('>Hours<');
    expect(html).not.toContain('<h2>메뉴</h2>');
  });
});

describe('invitation preview (사진 히어로·달력·예식 장소)', () => {
  const tpl = getTemplate('invitation')!;
  it('renders a photo hero + gallery and an auto calendar for the date', () => {
    const html = renderTemplate(tpl, {
      title: '꽃님 ♥ 민수',
      date: '2026년 9월 12일',
      venue: '어딘가 웨딩홀',
      photos: 'https://example.com/a.jpg\nhttps://example.com/b.jpg',
    });
    expect(html).toContain('class="photo-hero"');
    expect(html).toContain('https://example.com/a.jpg');
    expect(html).toContain('class="cal"'); // 날짜 → 자동 달력
    expect(html).toContain('어딘가 웨딩홀');
  });

  it('photo slots carry a self-contained placeholder background (never blank w/o image)', () => {
    const html = renderTemplate(tpl, {
      title: 'x',
      photos: 'https://example.com/a.jpg\nhttps://example.com/b.jpg',
    });
    // 히어로/갤러리 컨테이너 자체에 accent 배경을 깔아, 이미지가 없거나 로딩 중이어도
    // 흰/빈 화면이 아니라 온브랜드 그라데이션이 보인다(이미지 로드 시 가려짐).
    expect(html).toMatch(/\.photo-hero\{[^}]*background:[^}]*--accent/);
    expect(html).toMatch(/\.gallery img\{[^}]*background:[^}]*--accent/);
  });

  it('only accepts http(s) photo URLs (주입 차단)', () => {
    const html = renderTemplate(tpl, {
      title: 'x',
      photos: 'javascript:alert(1)\nhttps://ok.example.com/p.jpg',
    });
    expect(html).not.toContain('javascript:alert(1)');
    expect(html).toContain('https://ok.example.com/p.jpg');
  });
});

describe('launch preview (카운트다운·웨이트리스트·핵심 기능)', () => {
  const tpl = getTemplate('launch')!;
  it('renders countdown + waitlist + feature rows', () => {
    const html = renderTemplate(tpl, {
      title: '노을',
      date: '2026년 12월 1일 오전 10시',
      body: '하루 한 장 사진 일기',
      features: '하루 한 장 | 매일 저녁 사진을 남겨요',
    });
    expect(html).toContain('COMING SOON');
    expect(html).toContain('class="cd"'); // 카운트다운
    expect(html).toContain('class="wait"'); // 웨이트리스트
    expect(html).toContain('하루 한 장');
  });

  it('uses injected labels for waitlist/countdown chrome', () => {
    const labels = {
      ...DEFAULT_PREVIEW_LABELS,
      lang: 'en',
      waitlistBtn: 'Join waitlist',
      emailPlaceholder: 'Email address',
    };
    const html = renderTemplate(tpl, { title: 'x', date: '2026-12-01' }, labels);
    expect(html).toContain('Join waitlist');
    expect(html).toContain('placeholder="Email address"');
    expect(html).not.toContain('대기자 등록');
  });

  it('escapes user values in feature pipes (XSS-safe)', () => {
    const html = renderTemplate(tpl, {
      title: 'x',
      features: '<img src=x onerror=alert(1)> | <b>boom</b>',
    });
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img');
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
