import type { TemplateDefinition, TemplateValues } from '@vibestart/shared-types';

/** HTML 특수문자 이스케이프(사용자 값 XSS 방지). */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 연락처 자유텍스트에서 안전한 href를 추출한다(없으면 null).
 * 스킴(mailto/tel/https)을 코드가 직접 구성하고 사용자 문자열을 스킴 자리에 쓰지 않으므로
 * `javascript:` 등 주입이 원천 불가능하다. 우선순위: 이메일 → URL → 전화.
 */
export function contactHref(raw: string): string | null {
  const s = raw.trim();
  const email = s.match(/[\w.+-]+@[\w-]+\.[\w-]{2,}/);
  if (email) return `mailto:${email[0]}`;
  const url = s.match(/https?:\/\/[^\s<>"']+/i);
  if (url) return url[0];
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 9 && digits.length <= 11) return `tel:${digits}`;
  return null;
}

type Key = keyof TemplateValues;

/** 다크 + accent 앰비언트 블롭 + 명조 헤딩(실 브라우저) 공통 베이스. */
const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,system-ui,"Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",sans-serif;background:#0a0d15;color:#e8edf5;line-height:1.7;-webkit-font-smoothing:antialiased;min-height:100vh;position:relative;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;filter:blur(10px);
background:
 radial-gradient(720px 540px at 14% 12%, color-mix(in srgb,var(--accent) 62%, transparent), transparent 60%),
 radial-gradient(680px 520px at 86% 16%, rgba(56,189,248,.18), transparent 62%),
 radial-gradient(760px 560px at 78% 92%, color-mix(in srgb,var(--accent) 44%, transparent), transparent 62%),
 radial-gradient(620px 480px at 18% 90%, rgba(129,140,248,.16), transparent 62%)}
h1{font-family:"Nanum Myeongjo",Georgia,serif;color:#fff;letter-spacing:-.01em;word-break:keep-all;text-wrap:balance}
.tagline{font-family:"Nanum Myeongjo",Georgia,serif;word-break:keep-all;text-wrap:balance}
.body{white-space:pre-line;word-break:keep-all}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:999px;border:2px solid transparent;background-clip:padding-box}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.3);background-clip:padding-box}
::-webkit-scrollbar-track{background:transparent}
html{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}`;

/**
 * 템플릿 + 값 → 완성된 한 페이지 HTML(문자열). 결정론적·이스케이프.
 *
 * 카테고리마다 **골격(실루엣)이 완전히 다른** 글래스 레이아웃:
 *  intro       = 모노그램 원 + 좌측 비대칭(카드 없음)
 *  shop        = 가게 랜딩(히어로[타이틀+태그라인+CTA] + 소개 패널, 콘텐츠 기준 높이)
 *  invitation  = 각진 얇은 프레임 + 중앙 의례 + 장식
 * 작은 미리보기에서도 구분되도록 상단 히어로 요소를 강하게 둔다.
 */
export function renderTemplate(template: TemplateDefinition, values: TemplateValues): string {
  const accent = template.accent;
  const v = (key: Key): string => escapeHtml((values[key] ?? '').trim());
  const has = (key: Key): boolean =>
    template.fields.includes(key) && (values[key] ?? '').trim().length > 0;
  const title = v('title');
  const tagline = (): string => (has('tagline') ? `<p class="tagline">${v('tagline')}</p>` : '');
  const body = (): string => (has('body') ? `<div class="body">${v('body')}</div>` : '');
  // 연락처 CTA: 전화/이메일/URL이면 실제 링크(href), 아니면 비활성 표시. href는 코드 구성+이스케이프.
  const contactCta = (cls: string): string => {
    if (!has('contact')) return '';
    const raw = (values.contact ?? '').trim();
    const href = contactHref(raw);
    let attr = '';
    if (href) {
      attr = ` href="${escapeHtml(href)}"`;
      if (href.startsWith('http')) attr += ' target="_blank" rel="noopener noreferrer"';
    }
    return `<a class="${cls}"${attr}>${escapeHtml(raw)}</a>`;
  };

  let inner: string;
  let css: string;

  if (template.category === 'shop') {
    // 가게 랜딩 — 히어로(타이틀+태그라인+CTA) + 소개 패널. 콘텐츠 기준 높이(휑한 여백 방지)
    inner = `<div class="wrap shop">
<section class="hero"><h1>${title}</h1>${tagline()}${contactCta('cta')}</section>
${has('body') ? `<section class="info"><div class="panel">${body()}</div></section>` : ''}
</div>`;
    css = `
.wrap.shop{position:relative;z-index:1}
.shop .hero{text-align:center;padding:clamp(72px,15vh,150px) 28px clamp(48px,8vh,84px)}
.shop .hero h1{font-weight:800;font-size:clamp(2.6rem,8vw,4rem);line-height:1.12}
.shop .hero .tagline{color:rgba(232,237,245,.8);font-size:clamp(1.1rem,3.4vw,1.5rem);margin-top:16px}
.shop .hero .cta{display:inline-block;margin-top:32px;background:var(--accent);color:#fff;padding:15px 36px;border-radius:999px;font-weight:700;font-size:1.02rem;box-shadow:0 16px 36px -10px var(--accent)}
.shop .cta[href]{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
.shop .cta[href]:hover{transform:translateY(-2px);box-shadow:0 22px 46px -10px var(--accent)}
.shop .info{max-width:600px;margin:0 auto;padding:0 24px clamp(72px,12vh,120px)}
.shop .panel{background:rgba(255,255,255,.06);backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:clamp(32px,6vw,44px) clamp(28px,5vw,40px);box-shadow:0 24px 60px -16px rgba(0,0,0,.5)}
.shop .panel .body{font-size:1.05rem;line-height:2;color:rgba(232,237,245,.86);text-align:center}`;
  } else if (template.category === 'invitation') {
    // 각진 얇은 프레임 + 중앙 의례 + 장식
    inner = `<div class="wrap invite"><div class="v-inner">
<div class="v-orn">✦ ✦ ✦</div>
<h1>${title}</h1>
${tagline()}
${has('body') ? '<div class="v-rule"></div>' : ''}
${body()}
</div></div>`;
    css = `
.wrap.invite{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:clamp(40px,8vw,88px) 24px;position:relative;z-index:1}
.v-inner{max-width:470px;width:100%;text-align:center;border:1px solid rgba(255,255,255,.18);border-radius:4px;padding:clamp(44px,9vw,72px) clamp(28px,7vw,52px);background:rgba(255,255,255,.03);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.v-orn{color:var(--accent);font-size:20px;letter-spacing:8px;margin-bottom:26px}
.invite h1{font-weight:800;font-size:clamp(2rem,6vw,2.9rem);line-height:1.35}
.invite .tagline{color:rgba(232,237,245,.74);margin-top:18px;font-size:clamp(1rem,3vw,1.25rem);line-height:1.6}
.v-rule{width:1px;height:46px;background:var(--accent);opacity:.6;margin:32px auto}
.invite .body{font-size:1.02rem;line-height:2.1;letter-spacing:.01em;color:rgba(232,237,245,.82)}`;
  } else {
    // intro — 모노그램(이니셜) 원 + 좌측 비대칭, 카드 없음
    const first = escapeHtml(Array.from((values.title ?? '').trim())[0] ?? '·');
    inner = `<div class="wrap intro">
<div class="mono">${first}</div>
<h1>${title}</h1>
${tagline()}
${body()}
${contactCta('contact')}
</div>`;
    css = `
.wrap.intro{max-width:600px;margin:0 auto;padding:clamp(56px,10vw,96px) clamp(28px,6vw,40px) 90px;position:relative;z-index:1}
.mono{width:clamp(78px,16vw,96px);height:clamp(78px,16vw,96px);border-radius:50%;display:grid;place-items:center;font-family:"Nanum Myeongjo",Georgia,serif;font-weight:800;font-size:clamp(34px,7vw,42px);color:#fff;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 55%,transparent),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.18);box-shadow:0 16px 40px -12px var(--accent),inset 0 1px 0 rgba(255,255,255,.25);margin-bottom:30px}
.intro h1{font-weight:800;font-size:clamp(2.4rem,7vw,3.6rem);line-height:1.12}
.intro .tagline{color:rgba(232,237,245,.78);font-size:clamp(1.05rem,3vw,1.4rem);margin-top:14px}
.intro .body{margin-top:30px;font-size:1.06rem;color:rgba(232,237,245,.85)}
.intro .contact{display:inline-flex;align-items:center;gap:9px;margin-top:32px;padding:12px 24px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;font-weight:600;font-size:.95rem;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.intro .contact::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent)}
.intro .contact[href]{cursor:pointer;transition:transform .15s ease,border-color .15s ease,background .15s ease}
.intro .contact[href]:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.1)}`;
  }

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;800&display=swap" rel="stylesheet">
<style>:root{--accent:${accent}}${BASE_CSS}${css}</style></head>
<body>${inner}</body></html>`;
}
