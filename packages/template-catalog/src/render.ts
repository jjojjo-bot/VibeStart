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

type Key = keyof TemplateValues;

/**
 * 리퀴드 글래스 공통 베이스 — 다크 배경 + accent 틴트 앰비언트 블롭(유리 굴절의 원천)
 * + 글래스 카드(backdrop-filter). 헤딩은 명조 웹폰트(실 브라우저), 본문은 시스템 한글.
 */
const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,system-ui,"Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",sans-serif;background:#0a0d15;color:#e8edf5;line-height:1.75;-webkit-font-smoothing:antialiased;min-height:100vh;position:relative;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;filter:blur(10px);
background:
 radial-gradient(720px 540px at 14% 12%, color-mix(in srgb,var(--accent) 60%, transparent), transparent 60%),
 radial-gradient(680px 520px at 86% 16%, rgba(56,189,248,.18), transparent 62%),
 radial-gradient(760px 560px at 78% 92%, color-mix(in srgb,var(--accent) 42%, transparent), transparent 62%),
 radial-gradient(620px 480px at 18% 90%, rgba(129,140,248,.16), transparent 62%)}
h1{font-family:"Nanum Myeongjo",Georgia,serif;color:#fff;letter-spacing:-.01em}
.glass{background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.04));backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,255,255,.14);border-radius:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.20),0 24px 60px -16px rgba(0,0,0,.55)}
.tagline{font-family:"Nanum Myeongjo",Georgia,serif}
.body{white-space:pre-line}`;

/**
 * 템플릿 + 값 → 완성된 한 페이지 HTML(문자열).
 *
 * 결정론적·이스케이프. 카테고리마다 **다른 글래스 레이아웃**:
 * intro=히어로 텍스트 + 글래스 본문카드(좌측), shop=중앙 글래스 플라크+솔리드 CTA,
 * invitation=중앙 의례형 글래스 프레임. accent별 앰비언트 색으로 무드도 구분.
 */
export function renderTemplate(template: TemplateDefinition, values: TemplateValues): string {
  const accent = template.accent;
  const v = (key: Key): string => escapeHtml((values[key] ?? '').trim());
  const has = (key: Key): boolean =>
    template.fields.includes(key) && (values[key] ?? '').trim().length > 0;
  const title = v('title');
  const tagline = (): string => (has('tagline') ? `<p class="tagline">${v('tagline')}</p>` : '');
  const body = (): string => (has('body') ? `<div class="body">${v('body')}</div>` : '');

  let inner: string;
  let css: string;

  if (template.category === 'shop') {
    inner = `<div class="wrap shop"><div class="glass card">
<span class="mark"></span>
<h1>${title}</h1>
${tagline()}
${has('body') || has('contact') ? '<div class="rule"></div>' : ''}
${body()}
${has('contact') ? `<a class="cta">${v('contact')}</a>` : ''}
</div></div>`;
    css = `
.wrap.shop{min-height:100vh;display:grid;place-items:center;padding:clamp(28px,5vw,56px);position:relative;z-index:1}
.shop .card{max-width:440px;width:100%;padding:clamp(40px,6vw,52px) clamp(28px,5vw,44px);text-align:center}
.mark{display:block;width:46px;height:46px;border-radius:14px;background:var(--accent);margin:0 auto 22px;box-shadow:0 10px 26px -6px var(--accent)}
.shop h1{font-weight:800;font-size:clamp(2rem,5.5vw,2.7rem)}
.shop .tagline{color:rgba(232,237,245,.62);font-weight:400;font-size:1.1rem;margin-top:12px}
.rule{width:36px;height:2px;background:var(--accent);margin:24px auto;border-radius:2px}
.shop .body{font-size:1.02rem;color:rgba(232,237,245,.82)}
.cta{display:inline-block;margin-top:28px;background:var(--accent);color:#fff;padding:14px 30px;border-radius:999px;font-weight:700;font-size:.95rem;box-shadow:0 12px 28px -8px var(--accent)}`;
  } else if (template.category === 'invitation') {
    inner = `<div class="wrap invite"><div class="glass frame">
<div class="orn">✦ ✦ ✦</div>
<h1>${title}</h1>
${tagline()}
${has('body') ? '<div class="vrule"></div>' : ''}
${body()}
</div></div>`;
    css = `
.wrap.invite{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:clamp(40px,8vw,80px) 28px;position:relative;z-index:1}
.invite .frame{max-width:520px;width:100%;text-align:center;padding:clamp(48px,8vw,72px) clamp(32px,6vw,52px)}
.orn{color:var(--accent);font-size:18px;letter-spacing:10px;margin-bottom:30px}
.invite h1{font-weight:800;font-size:clamp(2.1rem,6vw,3rem);line-height:1.32}
.invite .tagline{color:rgba(232,237,245,.72);font-weight:400;font-size:clamp(1.05rem,3vw,1.3rem);margin-top:20px;line-height:1.6}
.vrule{width:1px;height:50px;background:var(--accent);opacity:.6;margin:36px auto}
.invite .body{font-size:1.05rem;line-height:2.1;letter-spacing:.01em;color:rgba(232,237,245,.82)}`;
  } else {
    // intro — 히어로 텍스트(블롭 위) + 글래스 본문 카드, 좌측 정렬
    inner = `<div class="wrap intro">
<header class="hero"><h1>${title}</h1>${tagline()}</header>
<div class="glass card">
${body()}
${has('contact') ? `<a class="contact">${v('contact')}</a>` : ''}
</div></div>`;
    css = `
.wrap.intro{max-width:660px;margin:0 auto;padding:clamp(64px,12vw,112px) clamp(24px,5vw,32px) 100px;position:relative;z-index:1}
.intro .hero h1{font-weight:800;font-size:clamp(2.6rem,7.5vw,4.2rem);line-height:1.12}
.intro .hero .tagline{color:rgba(255,255,255,.82);font-weight:400;font-size:clamp(1.1rem,3vw,1.5rem);margin-top:16px}
.intro .card{margin-top:36px;padding:clamp(28px,5vw,36px) clamp(26px,4vw,34px)}
.intro .body{font-size:1.07rem;color:rgba(232,237,245,.86)}
.intro .contact{display:inline-flex;align-items:center;gap:9px;margin-top:32px;padding:12px 24px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;font-weight:600;font-size:.95rem}
.intro .contact::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent)}`;
  }

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;800&display=swap" rel="stylesheet">
<style>:root{--accent:${accent}}${BASE_CSS}${css}</style></head>
<body>${inner}</body></html>`;
}
