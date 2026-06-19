import type {
  TemplateDefinition,
  TemplatePreviewLabels,
  TemplateValues,
} from '@vibestart/shared-types';

/**
 * 라벨 미주입 시 기본값(한국어). 발행 서빙(/p)·테스트 등 로케일 컨텍스트가 없는
 * 호출자가 그대로 쓰는 안전한 폴백. 웹 빌더는 활성 로케일 라벨을 주입한다.
 */
export const DEFAULT_PREVIEW_LABELS: TemplatePreviewLabels = {
  lang: 'ko',
  about: '소개',
  directions: '오시는 길',
  gallery: '사진첩',
  guestbook: '방명록',
  guestbookPlaceholder: '축하 메시지를 남겨주세요…',
  guestbookSamples: [
    { who: '김하늘', msg: '두 분 결혼 진심으로 축하해요! 행복하게 잘 사세요 💕' },
    { who: '이준호', msg: '늘 지금처럼 서로 아껴주는 부부 되세요 🤍' },
  ],
  todoAdd: '할 일 추가',
  todoProgress: '%total%개 중 %done%개 완료',
};

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
 * `javascript:` 등 주입이 원천 불가능하다. 우선순위: 이메일 → URL → 전화 → 인스타(@핸들).
 */
export function contactHref(raw: string): string | null {
  const s = raw.trim();
  const email = s.match(/[\w.+-]+@[\w-]+\.[\w-]{2,}/);
  if (email) return `mailto:${email[0]}`;
  const url = s.match(/https?:\/\/[^\s<>"']+/i);
  if (url) return url[0];
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 9 && digits.length <= 11) return `tel:${digits}`;
  const ig = s.match(/(?:^|[\s,;])@([A-Za-z0-9._]{2,30})/);
  if (ig) return `https://instagram.com/${ig[1]}`;
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
 * 카테고리마다 **구조(페이지 종류)가 완전히 다른** 레이아웃(동작 없는 정적):
 *  intro       = 인스타 프로필 풍(밝음): 아바타 + 바이오 + 링크 + 갤러리 그리드
 *  shop        = 실제 매장 랜딩(밝음): 히어로 사진 + 갤러리 + 소개 + 오시는 길
 *  todo        = 투두 앱 UI(밝음): 헤더 + 진행바 + 체크박스 목록 + 추가바
 *  invitation  = 모던 청첩장(밝음): 사진 히어로 + 인사말 + 사진첩 + 오시는 길 + 방명록
 */
export function renderTemplate(
  template: TemplateDefinition,
  values: TemplateValues,
  labels: TemplatePreviewLabels = DEFAULT_PREVIEW_LABELS,
): string {
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
    // 실제 매장 랜딩(밝음): 히어로 사진 + 갤러리 + 소개 + 오시는 길
    inner = `<div class="wrap store">
<section class="s-hero"><div class="s-hero-in"><h1>${title}</h1>${tagline()}${contactCta('s-cta')}</div></section>
<section class="s-gallery"><div class="s-photo g0"></div><div class="s-photo g1"></div><div class="s-photo g2"></div></section>
${has('body') ? `<section class="s-about"><h2>${labels.about}</h2>${body()}</section>` : ''}
<section class="s-map"><h2>${labels.directions}</h2><div class="s-mapbox"><span class="pin"><svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg></span></div></section>
</div>`;
    css = `
body{background:#f4eee4;color:#3a322b}
body::before{display:none}
.wrap.store{max-width:920px;margin:0 auto;min-height:100vh;background:#fffdf9;box-shadow:0 0 80px rgba(0,0,0,.06)}
.store .s-about .body,.store .s-map .s-mapbox{max-width:680px;margin-left:auto;margin-right:auto}
.store .s-hero{position:relative;min-height:clamp(260px,44vh,360px);display:flex;align-items:flex-end;background:linear-gradient(135deg,#c8a06a,#8a5a2b)}
.store .s-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5))}
.store .s-hero-in{position:relative;z-index:1;width:100%;text-align:center;padding:clamp(28px,6vw,44px)}
.store .s-hero h1{color:#fff;font-family:"Nanum Myeongjo",Georgia,serif;font-weight:800;font-size:clamp(2rem,6vw,2.9rem)}
.store .s-hero .tagline{color:rgba(255,255,255,.92);font-family:inherit;margin-top:10px;font-size:clamp(1rem,3vw,1.2rem)}
.store .s-cta{display:inline-block;margin-top:18px;background:#fff;color:#7a4f24;text-decoration:none;padding:11px 28px;border-radius:999px;font-weight:700;font-size:.95rem}
.store .s-gallery{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;padding:4px}
.store .s-photo{aspect-ratio:1}
.store .s-photo.g0{background:linear-gradient(135deg,#ecd3ac,#c8a06a)}
.store .s-photo.g1{background:linear-gradient(135deg,#d7b485,#a9763f)}
.store .s-photo.g2{background:linear-gradient(135deg,#efdcbd,#d3a96c)}
.store .s-about,.store .s-map{padding:clamp(30px,6vw,44px) 30px}
.store h2{font-family:"Nanum Myeongjo",Georgia,serif;color:#8a5a2b;font-weight:800;font-size:1.1rem;margin-bottom:14px}
.store .s-about .body{color:#4a4039;line-height:1.95;font-size:1rem}
.store .s-map{padding-bottom:clamp(48px,9vw,72px)}
.store .s-mapbox{position:relative;height:160px;border-radius:14px;overflow:hidden;background:#e7ddc9;display:grid;place-items:center}
.store .s-mapbox::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.06) 0 1px,transparent 1px 26px),repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 1px,transparent 1px 26px)}
.store .s-mapbox .pin{position:relative;display:block;color:#8a5a2b}`;
  } else if (template.category === 'invitation') {
    // 모던 청첩장(밝음): 사진 히어로 + 인사말 + 사진첩 + 오시는 길 + 방명록
    const ph = [0, 1, 2, 3, 4, 5].map((i) => `<div class="ph p${i % 3}"></div>`).join('');
    inner = `<div class="wrap card2">
<section class="c-hero"><div class="c-hero-in"><p class="c-eyebrow">WEDDING INVITATION</p><h1>${title}</h1>${tagline()}</div></section>
${has('body') ? `<section class="c-greet">${body()}</section>` : ''}
<section class="c-gallery"><h2>${labels.gallery}</h2><div class="c-grid">${ph}</div></section>
<section class="c-map"><h2>${labels.directions}</h2><div class="c-mapbox"><span class="pin"><svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg></span></div></section>
<section class="c-guest"><h2>${labels.guestbook}</h2><div class="gb-input">${labels.guestbookPlaceholder}</div>
${labels.guestbookSamples
  .map(
    (g) =>
      `<div class="gb-msg"><div class="who">${g.who}</div><div class="txt">${g.msg}</div></div>`,
  )
  .join('')}</section>
</div>`;
    css = `
body{background:#f7f0ec;color:#4a4040}
body::before{display:none}
.wrap.card2{max-width:720px;margin:0 auto;min-height:100vh;background:#fff;box-shadow:0 0 80px rgba(0,0,0,.06)}
.card2 .c-hero{position:relative;min-height:clamp(400px,64vh,540px);display:flex;align-items:center;justify-content:center;text-align:center;background:linear-gradient(165deg,#f1d7cf,#cf9aa0 65%,#9c6f7e)}
.card2 .c-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.32))}
.card2 .c-hero-in{position:relative;z-index:1;padding:30px}
.card2 .c-eyebrow{color:rgba(255,255,255,.85);letter-spacing:5px;font-size:12px;margin-bottom:20px}
.card2 .c-hero h1{color:#fff;font-family:"Nanum Myeongjo",Georgia,serif;font-weight:800;font-size:clamp(2.1rem,7vw,3rem);line-height:1.35}
.card2 .c-hero .tagline{color:rgba(255,255,255,.92);font-family:"Nanum Myeongjo",Georgia,serif;margin-top:16px;font-size:clamp(1rem,3vw,1.2rem)}
.card2 section{padding:clamp(34px,7vw,52px) 30px}
.card2 h2{text-align:center;font-family:"Nanum Myeongjo",Georgia,serif;color:#a96a72;letter-spacing:3px;font-size:1.05rem;margin-bottom:22px}
.card2 .c-greet{text-align:center}
.card2 .c-greet .body{color:#5a4f4f;line-height:2.1;font-size:1.02rem}
.card2 .c-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.card2 .ph{aspect-ratio:1;border-radius:6px}
.card2 .ph.p0{background:linear-gradient(135deg,#f3dcd6,#dcb0b0)}
.card2 .ph.p1{background:linear-gradient(135deg,#e7d6e2,#c4a3bd)}
.card2 .ph.p2{background:linear-gradient(135deg,#f1e2d2,#d8bd9c)}
.card2 .c-mapbox{position:relative;height:160px;border-radius:14px;overflow:hidden;background:#ece4e2;display:grid;place-items:center}
.card2 .c-mapbox::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.05) 0 1px,transparent 1px 26px),repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 1px,transparent 1px 26px)}
.card2 .c-mapbox .pin{position:relative;display:block;color:#a96a72}
.card2 .gb-input{border:1px solid #eaddd9;border-radius:12px;padding:15px 16px;color:#b7a3a0;background:#fdfbfa}
.card2 .gb-msg{border:1px solid #f0e6e3;border-radius:12px;padding:14px 16px;margin-top:12px}
.card2 .gb-msg .who{font-weight:700;color:#7a5a5c;font-size:.92rem}
.card2 .gb-msg .txt{color:#6a5d5c;font-size:.96rem;margin-top:5px;line-height:1.6}`;
  } else if (template.category === 'todo') {
    // 투두 앱 UI(밝음): 헤더 + 진행바 + 체크박스 목록 + 추가바 (정적)
    const lines = (values.body ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const items = lines.map((line) => ({
      done: /^(\[x\]|✓)\s*/i.test(line),
      label: escapeHtml(line.replace(/^(\[x\]|\[ \]|✓)\s*/i, '')),
    }));
    const doneCount = items.filter((i) => i.done).length;
    const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
    const rows = items
      .map(
        (it) =>
          `<div class="t-item${it.done ? ' done' : ''}"><span class="t-box"></span><span class="t-txt">${it.label}</span></div>`,
      )
      .join('');
    inner = `<div class="wrap todo">
<header class="t-head"><h1>${title}</h1>${tagline()}<div class="t-prog"><div class="bar"><i style="width:${pct}%"></i></div><div class="lbl">${labels.todoProgress.replace('%total%', String(items.length)).replace('%done%', String(doneCount))}</div></div></header>
<div class="t-list">${rows}</div>
<div class="t-add"><span class="plus">+</span><span>${labels.todoAdd}</span></div>
</div>`;
    css = `
body{background:#eef0f6;color:#1f2433}
body::before{display:none}
.wrap.todo{max-width:640px;margin:0 auto;min-height:100vh;background:#fff;box-shadow:0 0 80px rgba(0,0,0,.07)}
.todo .t-head{padding:clamp(30px,7vw,42px) 26px 22px;background:linear-gradient(135deg,#4f46e5,#7c74f0);color:#fff}
.todo .t-head h1{color:#fff;font-family:-apple-system,system-ui,sans-serif;font-weight:800;font-size:clamp(1.5rem,5vw,2rem)}
.todo .t-head .tagline{color:rgba(255,255,255,.85);font-family:-apple-system,system-ui,sans-serif;margin-top:6px;font-size:1rem}
.todo .t-prog{margin-top:20px}
.todo .t-prog .bar{height:8px;border-radius:999px;background:rgba(255,255,255,.28);overflow:hidden}
.todo .t-prog .bar>i{display:block;height:100%;background:#fff;border-radius:999px}
.todo .t-prog .lbl{margin-top:8px;font-size:.85rem;color:rgba(255,255,255,.9)}
.todo .t-list{padding:10px 20px}
.todo .t-item{display:flex;align-items:center;gap:14px;padding:15px 10px;border-bottom:1px solid #eef0f4}
.todo .t-box{flex:0 0 auto;width:24px;height:24px;border-radius:8px;border:2px solid #cdd2e0}
.todo .t-item.done .t-box{background:#4f46e5;border-color:#4f46e5;display:grid;place-items:center}
.todo .t-item.done .t-box::after{content:"✓";color:#fff;font-size:13px;font-weight:800}
.todo .t-txt{font-size:1.02rem;color:#2a2f3e}
.todo .t-item.done .t-txt{color:#a3a8ba;text-decoration:line-through}
.todo .t-add{display:flex;align-items:center;gap:12px;margin:10px 20px 30px;padding:15px 16px;border:2px dashed #d4d8e6;border-radius:14px;color:#9aa0b4}
.todo .t-add .plus{color:#4f46e5;font-size:20px;font-weight:800}`;
  } else {
    // 나 소개 — 인스타 프로필 풍(밝은 톤): 스토리링 아바타 + 바이오 + 링크 + 하이라이트 + 갤러리 그리드
    const first = escapeHtml(Array.from((values.title ?? '').trim())[0] ?? '·');
    const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8]
      .map((i) => `<div class="tile t${i % 6}"></div>`)
      .join('');
    const hls = [0, 1, 2, 3, 4].map((i) => `<div class="hl-c h${i}"></div>`).join('');
    inner = `<div class="wrap profile">
<header class="p-head">
<div class="avatar"><span>${first}</span></div>
<div class="p-id"><h1>${title}</h1>${tagline()}</div>
</header>
${has('body') ? `<div class="bio">${body()}</div>` : ''}
${contactCta('p-link')}
<div class="hl">${hls}</div>
<div class="grid">${tiles}</div>
</div>`;
    css = `
body{background:#fafafa;color:#222}
body::before{display:none}
.wrap.profile{max-width:860px;margin:0 auto;min-height:100vh;background:#fff;box-shadow:0 0 80px rgba(0,0,0,.07)}
.profile .bio{max-width:680px}
.profile .p-head{display:flex;align-items:center;gap:clamp(18px,5vw,30px);padding:clamp(28px,6vw,40px) 28px 16px}
.profile .avatar{flex:0 0 auto;width:clamp(78px,18vw,96px);height:clamp(78px,18vw,96px);border-radius:50%;padding:3px;background:conic-gradient(from 215deg,#f9ce34,#ee2a7b,#6228d7,#f9ce34)}
.profile .avatar span{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:#fff;color:#222;font-weight:800;font-size:clamp(30px,7vw,38px);font-family:"Nanum Myeongjo",Georgia,serif;border:2px solid #fff}
.profile .p-id h1{color:#111;font-family:-apple-system,system-ui,sans-serif;font-weight:800;font-size:clamp(1.35rem,4.5vw,1.7rem);letter-spacing:-.02em;line-height:1.2}
.profile .p-id .tagline{color:#666;font-family:-apple-system,system-ui,sans-serif;font-size:clamp(.95rem,2.8vw,1.05rem);margin-top:5px}
.profile .bio{padding:6px 28px 0;color:#2a2a2a;font-size:1rem;line-height:1.65}
.profile .p-link{display:inline-block;margin:16px 28px 0;color:var(--accent);font-weight:700;text-decoration:none;font-size:.98rem}
.profile .p-link[href]:hover{text-decoration:underline}
.profile .hl{display:flex;gap:clamp(14px,4vw,20px);padding:22px 28px 18px;overflow-x:auto}
.profile .hl-c{flex:0 0 auto;width:64px;height:64px;border-radius:50%;border:1px solid #ededed}
.profile .hl-c.h0{background:linear-gradient(135deg,#ffe3d0,#ffc09a)}
.profile .hl-c.h1{background:linear-gradient(135deg,#d8e9ff,#a9c8ff)}
.profile .hl-c.h2{background:linear-gradient(135deg,#e9ddff,#c4abff)}
.profile .hl-c.h3{background:linear-gradient(135deg,#d6f5e3,#a3e0c0)}
.profile .hl-c.h4{background:linear-gradient(135deg,#ffe0ef,#ffb0d2)}
.profile .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:6px}
.profile .tile{aspect-ratio:1}
.profile .tile.t0{background:linear-gradient(135deg,var(--accent),#ffb98f)}
.profile .tile.t1{background:linear-gradient(135deg,#3f8ed6,#83cffb)}
.profile .tile.t2{background:linear-gradient(135deg,#7d5fd6,#b89dff)}
.profile .tile.t3{background:linear-gradient(135deg,#e06a93,#ffb0c8)}
.profile .tile.t4{background:linear-gradient(135deg,#2f9e6f,#88ddb5)}
.profile .tile.t5{background:linear-gradient(135deg,#d9a441,#ffdc92)}`;
  }

  return `<!doctype html>
<html lang="${labels.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;800&display=swap" rel="stylesheet">
<style>:root{--accent:${accent}}${BASE_CSS}${css}</style></head>
<body>${inner}</body></html>`;
}
