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
.body{white-space:pre-line;word-break:keep-all}`;

/**
 * 템플릿 + 값 → 완성된 한 페이지 HTML(문자열). 결정론적·이스케이프.
 *
 * 카테고리마다 **골격(실루엣)이 완전히 다른** 글래스 레이아웃:
 *  intro       = 모노그램 원 + 좌측 비대칭(카드 없음)
 *  shop        = 카드 + 솔리드 컬러 헤더 밴드(간판)
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

  let inner: string;
  let css: string;

  if (template.category === 'shop') {
    // 카드 + 솔리드 컬러 헤더 밴드(간판)
    inner = `<div class="wrap shop"><div class="s-card">
<div class="s-head"><h1>${title}</h1>${tagline()}</div>
<div class="s-body">${body()}${has('contact') ? `<a class="s-cta">${v('contact')}</a>` : ''}</div>
</div></div>`;
    css = `
.wrap.shop{min-height:100vh;display:grid;place-items:center;padding:clamp(24px,5vw,56px);position:relative;z-index:1}
.s-card{max-width:420px;width:100%;border-radius:24px;overflow:hidden;background:rgba(255,255,255,.06);backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 60px -16px rgba(0,0,0,.55)}
.s-head{background:linear-gradient(145deg,var(--accent),color-mix(in srgb,var(--accent) 60%,#000));padding:clamp(32px,6vw,44px) 32px clamp(28px,5vw,36px);text-align:center}
.s-head h1{font-weight:800;font-size:clamp(1.9rem,5vw,2.5rem)}
.s-head .tagline{color:rgba(255,255,255,.9);margin-top:10px;font-size:1.05rem}
.s-body{padding:clamp(28px,5vw,36px) 32px;text-align:center}
.s-body .body{font-size:1.02rem;color:rgba(232,237,245,.85);line-height:1.95}
.s-cta{display:inline-block;margin-top:24px;background:var(--accent);color:#fff;padding:13px 30px;border-radius:999px;font-weight:700;font-size:.95rem;box-shadow:0 12px 28px -8px var(--accent)}`;
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
${has('contact') ? `<a class="contact">${v('contact')}</a>` : ''}
</div>`;
    css = `
.wrap.intro{max-width:600px;margin:0 auto;padding:clamp(56px,10vw,96px) clamp(28px,6vw,40px) 90px;position:relative;z-index:1}
.mono{width:clamp(78px,16vw,96px);height:clamp(78px,16vw,96px);border-radius:50%;display:grid;place-items:center;font-family:"Nanum Myeongjo",Georgia,serif;font-weight:800;font-size:clamp(34px,7vw,42px);color:#fff;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 55%,transparent),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.18);box-shadow:0 16px 40px -12px var(--accent),inset 0 1px 0 rgba(255,255,255,.25);margin-bottom:30px}
.intro h1{font-weight:800;font-size:clamp(2.4rem,7vw,3.6rem);line-height:1.12}
.intro .tagline{color:rgba(232,237,245,.78);font-size:clamp(1.05rem,3vw,1.4rem);margin-top:14px}
.intro .body{margin-top:30px;font-size:1.06rem;color:rgba(232,237,245,.85)}
.intro .contact{display:inline-flex;align-items:center;gap:9px;margin-top:32px;padding:12px 24px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;font-weight:600;font-size:.95rem;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.intro .contact::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent)}`;
  }

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;800&display=swap" rel="stylesheet">
<style>:root{--accent:${accent}}${BASE_CSS}${css}</style></head>
<body>${inner}</body></html>`;
}
