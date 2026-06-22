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
  madeWith: 'VibeStart로 만든 페이지',
  about: '소개',
  expertise: '전문 분야',
  work: '주요 작업',
  links: '연결',
  directions: '오시는 길',
  menu: '메뉴',
  hours: '영업시간',
  invite: '초대합니다',
  ourMoments: '우리의 순간',
  weddingDate: '예식일',
  venueHeading: '예식 장소',
  giftHeading: '마음 전하기',
  weekdays: ['일', '월', '화', '수', '목', '금', '토'],
  launchAbout: '이런 거예요',
  launchFeatures: '핵심 기능',
  cdDays: '일',
  cdHours: '시간',
  cdMins: '분',
  cdSecs: '초',
  emailPlaceholder: '이메일 주소',
  waitlistBtn: '대기자 등록',
  waitlistProof: '출시되면 가장 먼저 알려드릴게요',
  waitlistDone: '신청 완료! 출시되면 가장 먼저 알려드릴게요',
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

/** 다크 오로라 글래스 공통 — 배경 + 마우스 반응 메시(--mx/--my/--hue) + 그레인 + 커서 빛. accent 구동. */
const AURORA_CSS = `body{background:#070611;color:#fff;min-height:100vh;padding:0 20px;font-family:'Pretendard',-apple-system,system-ui,"Apple SD Gothic Neo",sans-serif;overflow-x:hidden}
body::before{content:"";position:fixed;inset:-28%;z-index:0;pointer-events:none;filter:blur(80px) saturate(160%) hue-rotate(calc((var(--hue,20) - 20) * 1deg));opacity:.96;will-change:transform;transform:translate3d(calc((var(--mx,.5) - .5) * -100px),calc((var(--my,.4) - .4) * -100px),0) rotate(calc((var(--mx,.5) - .5) * 5deg)) scale(1.1);background:
 radial-gradient(36% 38% at 6% 3%, color-mix(in srgb,var(--accent) 96%, #ffb487), transparent 56%),
 radial-gradient(34% 36% at 96% 7%, #7b6bff, transparent 58%),
 radial-gradient(40% 42% at 95% 64%, #ff5d7a, transparent 56%),
 radial-gradient(38% 42% at 4% 80%, #1fe6d2, transparent 58%),
 radial-gradient(40% 40% at 90% 99%, color-mix(in srgb,var(--accent) 78%, #ff8a5c), transparent 60%)}
body::after{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.rip{position:fixed;inset:0;z-index:0;pointer-events:none;mix-blend-mode:screen;opacity:.95;filter:blur(18px);background:radial-gradient(46vmax 46vmax at calc(var(--mx,.5)*100%) calc(var(--my,.4)*100%),hsl(var(--hue,20) 85% 58% / .5),transparent 58%),radial-gradient(17vmax 17vmax at calc(var(--mx,.5)*100%) calc(var(--my,.4)*100%),hsl(calc(var(--hue,20) + 28) 92% 72% / .7),transparent 60%)}`;

const RIP_DIV = '<div class="rip"></div>';

/**
 * 사진 슬롯 플레이스홀더 아이콘(data-uri, stroke=white) — accent 그라데이션과 함께
 * 사진 컨테이너 배경에 깔린다. 실제 이미지가 로드되면 그 위를 덮어 가려지고,
 * URL이 없거나 로딩 중·실패면 빈 칸 대신 이 "사진 자리" 표시가 보인다.
 */
const PHOTO_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-opacity='0.55' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='14' rx='2.4'/%3E%3Ccircle cx='8.5' cy='10.2' r='1.7'/%3E%3Cpath d='m20 16.5-5-5L5 19.5'/%3E%3C/svg%3E";

/** 포인터 추적 → --mx/--my/--hue (rAF lerp + 상시 sine + 위치별 색). 사용자 입력 없음, reduced-motion·탭가시성 가드. */
const WAVE_SCRIPT = `<script>(function(){var r=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var tx=.5,ty=.4,cx=.5,cy=.4,t=0,run=true;function loop(){if(!run)return;t+=.016;cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;var h=(20+(cx-.5)*300+(cy-.5)*120+Math.sin(t*.6)*12)%360;if(h<0)h+=360;r.style.setProperty('--mx',(cx+Math.sin(t*.9)*.05+Math.sin(t*.37)*.025).toFixed(4));r.style.setProperty('--my',(cy+Math.cos(t*.7)*.045+Math.sin(t*.51)*.025).toFixed(4));r.style.setProperty('--hue',h.toFixed(1));requestAnimationFrame(loop);}function move(e){var p=e.touches&&e.touches[0]?e.touches[0]:e;tx=p.clientX/innerWidth;ty=p.clientY/innerHeight;}addEventListener('pointermove',move,{passive:true});addEventListener('touchmove',move,{passive:true});document.addEventListener('visibilitychange',function(){if(document.hidden){run=false;}else if(!run){run=true;requestAnimationFrame(loop);}});requestAnimationFrame(loop);})();</script>`;

/**
 * 커서 파티클(캔버스) — 템플릿 성격별 변형. move=반짝 트레일, pointerdown=버스트(폭죽).
 * 사용자 입력 없음(opts는 카탈로그 값). reduced-motion 가드. z-index 3(콘텐츠 위).
 */
function sparkScript(o: {
  cols: string[];
  rate: number;
  moveN: number;
  moveSp: number;
  burstN: number;
  burstSp: number;
  grav: number;
}): string {
  return `<script>(function(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var c=document.createElement('canvas');c.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:3;pointer-events:none';document.body.appendChild(c);var g=c.getContext('2d'),ps=[],W,H,dpr=Math.min(window.devicePixelRatio||1,2);function rs(){W=c.width=innerWidth*dpr;H=c.height=innerHeight*dpr;}rs();addEventListener('resize',rs);var C=${JSON.stringify(o.cols)};function add(px,py,n,sp){for(var i=0;i<n;i++){var a=Math.random()*6.283,v=sp*(0.4+Math.random());ps.push({x:px*dpr,y:py*dpr,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,r:(0.7+Math.random()*1.8)*dpr,c:C[(Math.random()*C.length)|0]});}}var last=0;addEventListener('pointermove',function(e){if(e.timeStamp-last>${o.rate}){last=e.timeStamp;add(e.clientX,e.clientY,${o.moveN},${o.moveSp}*dpr);}},{passive:true});addEventListener('pointerdown',function(e){add(e.clientX,e.clientY,${o.burstN},${o.burstSp}*dpr);},{passive:true});function loop(){g.clearRect(0,0,W,H);for(var i=ps.length-1;i>=0;i--){var p=ps[i];p.x+=p.vx;p.y+=p.vy;p.vy+=${o.grav}*dpr;p.vx*=0.985;p.l-=0.016;if(p.l<=0){ps.splice(i,1);continue;}g.globalAlpha=Math.max(0,p.l);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,Math.max(0.1,p.r*p.l),0,6.283);g.fill();}g.globalAlpha=1;requestAnimationFrame(loop);}requestAnimationFrame(loop);})();</script>`;
}

/** 리퀴드 글래스 추상 지도(SVG) — shop·invitation 공용. 도로/블록/공원 + 맥동 핀. accent 구동. */
const MAP_SVG = `<svg class="map-svg" viewBox="0 0 400 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="map-blocks"><rect x="18" y="20" width="104" height="66" rx="9"/><rect x="146" y="12" width="86" height="52" rx="9"/><rect x="258" y="24" width="124" height="62" rx="9"/><rect x="20" y="120" width="98" height="90" rx="9"/><rect x="262" y="122" width="120" height="104" rx="9"/></g><rect class="map-park" x="146" y="90" width="88" height="80" rx="16"/><g class="map-roads"><path d="M-10 102 H410"/><path d="M-10 182 H410"/><path d="M134 -10 V280"/><path d="M248 -10 V280"/></g><path class="map-main" d="M-10 246 C 110 214 176 132 414 44"/><g transform="translate(190,150)"><circle class="map-halo" r="40"/><circle class="map-ring" r="16"/><path class="map-pin" d="M0 -17 C 9.4 -17 16 -9.6 16 -1 C 16 9.5 0 21 0 21 C 0 21 -16 9.5 -16 -1 C -16 -9.6 -9.4 -17 0 -17 Z"/><circle class="map-dot" cx="0" cy="-1.5" r="4.6"/></g></svg>`;

/**
 * 템플릿 + 값 → 완성된 한 페이지 HTML(문자열). 결정론적·이스케이프.
 *
 * 카테고리마다 **구조(페이지 종류)가 완전히 다른** 레이아웃(동작 없는 정적):
 *  intro       = 다크 글래스 링크인바이오: 모노그램 + 바이오 + 작업 + 링크 스택
 *  shop        = 다크 글래스 매장 랜딩: 히어로 + 소개 + 메뉴판 + 오시는 길(지도)
 *  invitation  = 다크 글래스 모던 청첩장: 사진 히어로 + 인사말 + 사진첩 + 달력 + 마음 전하기
 *  launch      = 다크 글래스 Coming Soon: 카운트다운 + 웨이트리스트 + 핵심 기능
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
    // 가게·공방 — 다크 오로라 글래스 매장 랜딩: 히어로 + 소개 + 대표 메뉴 카드 + 영업 안내.
    const mark = escapeHtml(Array.from((values.title ?? '').trim())[0] ?? '·');
    const menuHtml = has('menu')
      ? (values.menu ?? '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 12)
          .map((line) => {
            const parts = line.split('|').map((s) => s.trim());
            const nm = parts[0] ?? '';
            const ds = parts[1] ?? '';
            const pr = parts[2] ?? '';
            const price = pr
              ? `<span class="mi-dots"></span><span class="mi-price">${escapeHtml(pr)}</span>`
              : '';
            return `<div class="mi"><div class="mi-top"><span class="mi-name">${escapeHtml(nm)}</span>${price}</div>${ds ? `<div class="mi-desc">${escapeHtml(ds)}</div>` : ''}</div>`;
          })
          .join('')
      : '';
    const pin =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
    const mapSvg = MAP_SVG;
    inner = `${RIP_DIV}
<main class="page">
<header class="glass hero">
<div class="mono"><span>${mark}</span></div>
<h1>${title}</h1>
${has('tagline') ? `<p class="lede">${v('tagline')}</p>` : ''}
${contactCta('s-cta')}
</header>
${has('body') ? `<section class="sec"><h2>${labels.about}</h2><div class="bio">${v('body')}</div></section>` : ''}
${menuHtml ? `<section class="sec"><h2>${labels.menu}</h2><div class="glass menu-board"><div class="menu-grid">${menuHtml}</div></div></section>` : ''}
${has('hours') || has('location') ? `<section class="sec"><h2>${labels.directions}</h2><div class="visit"><div class="glass mapcard">${mapSvg}${has('location') ? `<div class="map-addr"><span class="map-pin-ic">${pin}</span><span>${v('location')}</span></div>` : ''}</div>${has('hours') ? `<div class="glass hourscard"><div class="ic-h">${labels.hours}</div><div class="ic-b">${v('hours')}</div></div>` : ''}</div></section>` : ''}
<footer class="mark"><span class="mk">&gt;_</span><span>${labels.madeWith}</span></footer>
</main>
${WAVE_SCRIPT}
${sparkScript({ cols: ['#ffe6c2', '#ffd0a0', '#fff2dd', '#ffbf8a'], rate: 85, moveN: 1, moveSp: 0.7, burstN: 9, burstSp: 2.2, grav: -0.02 })}`;
    css = `${AURORA_CSS}
.page{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:clamp(34px,5vw,60px) 0 clamp(40px,6vw,64px);display:flex;flex-direction:column;gap:clamp(22px,3vw,38px)}
.glass{position:relative;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.022));border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 100px -34px rgba(0,0,0,.92),0 0 90px -22px color-mix(in srgb,var(--accent) 42%, transparent),inset 0 1px 0 rgba(255,255,255,.28);backdrop-filter:blur(28px) saturate(135%);-webkit-backdrop-filter:blur(28px) saturate(135%)}
.hero{text-align:center;padding:clamp(40px,6vw,60px) clamp(24px,5vw,48px)}
.mono{width:clamp(78px,9vw,96px);aspect-ratio:1;margin:0 auto 22px;border-radius:26px;display:grid;place-items:center;position:relative;background:linear-gradient(150deg,color-mix(in srgb,var(--accent) 86%,#cdeecf),color-mix(in srgb,var(--accent) 42%,#10241a));border:1px solid rgba(255,255,255,.2);box-shadow:0 20px 44px -10px color-mix(in srgb,var(--accent) 78%, transparent),0 0 0 6px color-mix(in srgb,var(--accent) 12%, transparent),inset 0 1px 0 rgba(255,255,255,.45)}
.mono::after{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(78% 58% at 30% 18%,rgba(255,255,255,.5),transparent 62%);opacity:.5}
.mono span{position:relative;z-index:1;font-weight:800;font-size:clamp(30px,4vw,40px);color:#fff;letter-spacing:-.02em;text-shadow:0 2px 10px rgba(0,0,0,.28)}
.hero h1{font-family:'Pretendard',-apple-system,sans-serif;font-weight:800;font-size:clamp(2.1rem,5vw,3rem);line-height:1.12;letter-spacing:-.035em;background:linear-gradient(176deg,#fff 38%,#d6f0dc);-webkit-background-clip:text;background-clip:text;color:transparent;word-break:keep-all;text-wrap:balance}
.lede{margin:14px auto 0;max-width:38ch;color:rgba(255,255,255,.78);font-size:clamp(1rem,1.6vw,1.12rem);line-height:1.7;word-break:keep-all}
.s-cta{display:inline-flex;align-items:center;gap:8px;margin-top:24px;padding:14px 28px;border-radius:999px;background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 92%,#5fcf8a),var(--accent));color:#fff;text-decoration:none;font-weight:700;font-size:1rem;border:1px solid color-mix(in srgb,var(--accent) 55%,#fff);box-shadow:0 16px 34px -10px color-mix(in srgb,var(--accent) 80%, transparent),inset 0 1px 0 rgba(255,255,255,.34);transition:transform .16s ease}
.s-cta:hover{transform:translateY(-2px)}
.sec{position:relative;z-index:2}
.sec h2{font-size:.8rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:color-mix(in srgb,var(--accent) 56%,#fff);display:flex;align-items:center;gap:14px;margin-bottom:16px}
.sec h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.14),transparent)}
.bio{color:rgba(255,255,255,.78);font-size:clamp(1.02rem,1.3vw,1.1rem);line-height:1.85;white-space:pre-line;word-break:keep-all;max-width:62ch}
.menu-board{padding:clamp(14px,2vw,26px) clamp(22px,3.4vw,44px)}
.menu-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 clamp(30px,4.5vw,60px)}
.mi{padding:15px 0;border-bottom:1px dashed rgba(255,255,255,.13)}
.mi-top{display:flex;align-items:baseline;gap:8px}
.mi-name{font-weight:700;font-size:1.06rem;color:#fff;letter-spacing:-.01em;word-break:keep-all}
.mi-dots{flex:1;min-width:16px;align-self:center;border-top:1px dotted rgba(255,255,255,.32);margin:0 2px}
.mi-price{flex:0 0 auto;font-weight:700;font-size:1rem;color:color-mix(in srgb,var(--accent) 74%,#fff);white-space:nowrap}
.mi-desc{margin-top:5px;font-size:.88rem;color:rgba(255,255,255,.56);line-height:1.5;word-break:keep-all}
.visit{display:grid;grid-template-columns:1.6fr 1fr;gap:13px;align-items:stretch}
.mapcard{position:relative;min-height:clamp(230px,26vw,300px);overflow:hidden;padding:0}
.map-svg{position:absolute;inset:0;width:100%;height:100%;background:radial-gradient(120% 90% at 50% 0%,#0d1320,#070a12)}
.map-blocks rect{fill:rgba(255,255,255,.035);stroke:rgba(255,255,255,.05);stroke-width:1}
.map-park{fill:color-mix(in srgb,var(--accent) 18%, transparent);stroke:color-mix(in srgb,var(--accent) 26%, transparent);stroke-width:1}
.map-roads path{fill:none;stroke:rgba(255,255,255,.085);stroke-width:7;stroke-linecap:round}
.map-main{fill:none;stroke:color-mix(in srgb,var(--accent) 60%,#fff);stroke-width:5;stroke-linecap:round;opacity:.9}
.map-halo{fill:var(--accent);opacity:.3;filter:blur(9px)}
.map-ring{fill:none;stroke:color-mix(in srgb,var(--accent) 55%,#fff);stroke-width:2.5;transform-box:fill-box;transform-origin:center;animation:mapping 2.6s ease-out infinite}
.map-pin{fill:var(--accent);stroke:#fff;stroke-width:1.6}
.map-dot{fill:#fff}
@keyframes mapping{0%{transform:scale(.5);opacity:.8}70%{opacity:0}100%{transform:scale(2.4);opacity:0}}
.map-addr{position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;gap:9px;padding:11px 14px;border-radius:14px;background:rgba(10,14,22,.55);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);color:rgba(255,255,255,.9);font-size:.92rem;line-height:1.4;word-break:keep-all;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.map-addr .map-pin-ic{flex:0 0 auto;color:color-mix(in srgb,var(--accent) 75%,#fff);display:grid;place-items:center}
.hourscard{padding:20px 22px}
.ic-h{font-size:.78rem;font-weight:700;letter-spacing:.04em;color:color-mix(in srgb,var(--accent) 60%,#fff);margin-bottom:9px}
.ic-b{color:rgba(255,255,255,.82);font-size:.98rem;line-height:1.7;white-space:pre-line;word-break:keep-all}
@media (prefers-reduced-motion:reduce){.map-ring{animation:none}}
.mark{display:flex;align-items:center;justify-content:center;gap:7px;color:rgba(255,255,255,.42);font-size:.8rem;font-weight:500;letter-spacing:.01em;margin-top:8px}
.mark .mk{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:color-mix(in srgb,var(--accent) 64%,#fff);font-weight:700}
@media (max-width:720px){.visit,.menu-grid{grid-template-columns:1fr}}`;
  } else if (template.category === 'invitation') {
    // 청첩장 — 다크 오로라 글래스 모던 청첩장: 명조 히어로 + 떨어지는 꽃잎 + 인사말
    // + 날짜 자동 달력(예식일 강조) + 예식 장소 + 지도 + 마음 전하기. "결혼하고 싶어" 톤.
    const pin =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
    const orn =
      '<svg class="orn" viewBox="0 0 220 20" aria-hidden="true"><path class="orn-l" d="M6 10 H92"/><path class="orn-l" d="M128 10 H214"/><g class="orn-f"><circle cx="110" cy="10" r="2.3"/><ellipse cx="110" cy="3.6" rx="1.7" ry="3.3"/><ellipse cx="110" cy="16.4" rx="1.7" ry="3.3"/><ellipse cx="103.6" cy="10" rx="3.3" ry="1.7"/><ellipse cx="116.4" cy="10" rx="3.3" ry="1.7"/></g></svg>';
    // 떨어지는 꽃잎(7장) — 위치·속도·시작 다르게.
    const petalConf = [
      [6, 13, 0],
      [18, 17, 4],
      [32, 11, 2],
      [47, 16, 7],
      [63, 12, 1],
      [78, 18, 5],
      [90, 14, 3],
    ];
    const petals = `<div class="petals" aria-hidden="true">${petalConf
      .map(([l, dur, de]) => `<i style="left:${l}%;animation-duration:${dur}s;animation-delay:-${de}s"></i>`)
      .join('')}</div>`;
    // 날짜 자동 달력 — "YYYY..M..D" 파싱 → 해당 월 그리드, 예식일 강조. 명시 일자라 결정론적.
    let calHtml = '';
    const dm = has('date') ? (values.date ?? '').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/) : null;
    if (dm) {
      const y = Number(dm[1]);
      const mo = Number(dm[2]);
      const dd = Number(dm[3]);
      const firstDow = new Date(y, mo - 1, 1).getDay();
      const last = new Date(y, mo, 0).getDate();
      const dows = labels.weekdays
        .map((w) => `<span class="cal-w">${escapeHtml(w)}</span>`)
        .join('');
      let cells = '';
      for (let i = 0; i < firstDow; i++) cells += '<span class="cal-x"></span>';
      for (let d = 1; d <= last; d++)
        cells += `<span class="${d === dd ? 'cal-c cal-on' : 'cal-c'}">${d}</span>`;
      calHtml = `<div class="cal"><div class="cal-h">${y}. ${String(mo).padStart(2, '0')}</div><div class="cal-grid">${dows}${cells}</div></div>`;
    }
    // 사진 — http(s) URL만 허용(주입 방지). 첫 장=히어로 배경, 나머지=갤러리.
    const photos = has('photos')
      ? (values.photos ?? '')
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => /^https?:\/\//i.test(s))
          .slice(0, 7)
      : [];
    const heroPhoto = photos[0] ?? '';
    const galleryPhotos = photos.slice(1);
    inner = `${RIP_DIV}
${petals}
<main class="page invite">
${heroPhoto
  ? `<header class="photo-hero"><img src="${escapeHtml(heroPhoto)}" alt="" loading="lazy" referrerpolicy="no-referrer"><p class="ph-eyebrow">WEDDING INVITATION</p><div class="ph-body"><h1 class="names">${title}</h1>${orn}${has('tagline') ? `<p class="lede">${v('tagline')}</p>` : ''}${has('date') ? `<p class="hdate">${v('date')}</p>` : ''}</div></header>`
  : `<header class="hero"><p class="eyebrow">WEDDING INVITATION</p><h1 class="names">${title}</h1>${orn}${has('tagline') ? `<p class="lede">${v('tagline')}</p>` : ''}${has('date') ? `<p class="hdate">${v('date')}</p>` : ''}</header>`}
${has('body') ? `<section class="sec"><h2>${labels.invite}</h2><div class="bio">${v('body')}</div></section>` : ''}
${galleryPhotos.length ? `<section class="sec"><h2>${labels.ourMoments}</h2><div class="gallery">${galleryPhotos.map((u) => `<img src="${escapeHtml(u)}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join('')}</div></section>` : ''}
${calHtml ? `<section class="sec"><h2>${labels.weddingDate}</h2>${calHtml}</section>` : ''}
${has('venue') ? `<section class="sec"><h2>${labels.venueHeading}</h2><div class="venue">${v('venue')}</div></section>` : ''}
${has('location') ? `<section class="sec"><h2>${labels.directions}</h2><div class="glass mapcard">${MAP_SVG}<div class="map-addr"><span class="map-pin-ic">${pin}</span><span>${v('location')}</span></div></div></section>` : ''}
${has('contact') ? `<section class="sec"><h2>${labels.giftHeading}</h2><div class="glass giftbox"><div class="gift-b">${v('contact')}</div></div></section>` : ''}
<footer class="mark"><span class="mk">&gt;_</span><span>${labels.madeWith}</span></footer>
</main>
${WAVE_SCRIPT}
${sparkScript({ cols: ['#ffffff', '#ffe1b0', '#f6c2da', '#cbb0ff'], rate: 55, moveN: 1, moveSp: 1.3, burstN: 18, burstSp: 4.4, grav: 0.05 })}`;
    css = `${AURORA_CSS}
.petals{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.petals i{position:absolute;top:-6vh;width:13px;height:13px;border-radius:82% 8% 82% 8%;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 60%,#fff),color-mix(in srgb,var(--accent) 32%,#ffd6e6));opacity:0;animation-name:petal;animation-timing-function:linear;animation-iteration-count:infinite;filter:blur(.3px)}
@keyframes petal{0%{transform:translateY(-6vh) translateX(0) rotate(0);opacity:0}12%{opacity:.5}88%{opacity:.45}100%{transform:translateY(108vh) translateX(44px) rotate(430deg);opacity:0}}
.page.invite{position:relative;z-index:2;max-width:600px;margin:0 auto;padding:0 0 clamp(44px,6vw,64px);display:flex;flex-direction:column;gap:clamp(30px,4.5vw,48px);text-align:center}
.glass{position:relative;border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 100px -34px rgba(0,0,0,.92),0 0 90px -22px color-mix(in srgb,var(--accent) 42%, transparent),inset 0 1px 0 rgba(255,255,255,.26);backdrop-filter:blur(26px) saturate(135%);-webkit-backdrop-filter:blur(26px) saturate(135%)}
.hero{padding:clamp(70px,14vw,130px) 18px clamp(6px,2vw,14px)}
.eyebrow{font-size:.72rem;font-weight:600;letter-spacing:.44em;text-transform:uppercase;color:color-mix(in srgb,var(--accent) 54%,#fff);margin-left:.44em}
.names{font-family:"Nanum Myeongjo",Georgia,serif;font-weight:800;font-size:clamp(2.5rem,9.5vw,3.9rem);line-height:1.32;letter-spacing:.01em;margin-top:24px;color:#fff;text-shadow:0 2px 40px color-mix(in srgb,var(--accent) 50%, transparent);word-break:keep-all}
.orn{display:block;width:clamp(170px,46vw,210px);height:20px;margin:26px auto 0;color:color-mix(in srgb,var(--accent) 62%,#fff)}
.orn .orn-l{stroke:currentColor;stroke-width:1;opacity:.5}
.orn .orn-f{fill:currentColor}
.lede{font-family:"Nanum Myeongjo",Georgia,serif;margin:24px auto 0;max-width:26ch;color:rgba(255,255,255,.84);font-size:clamp(1.06rem,2.7vw,1.24rem);line-height:1.9;white-space:pre-line;word-break:keep-all}
.hdate{margin-top:22px;font-size:.96rem;letter-spacing:.12em;color:color-mix(in srgb,var(--accent) 48%,#fff)}
.photo-hero{position:relative;border-radius:24px;overflow:hidden;min-height:clamp(460px,66vh,640px);display:flex;align-items:flex-end;border:1px solid rgba(255,255,255,.14);box-shadow:0 44px 110px -36px rgba(0,0,0,.92),0 0 90px -28px color-mix(in srgb,var(--accent) 42%, transparent);background:url("${PHOTO_ICON}") center 42% / clamp(54px,11vw,84px) no-repeat,linear-gradient(155deg,color-mix(in srgb,var(--accent) 50%,#241830),color-mix(in srgb,var(--accent) 16%,#0c0a14))}
.photo-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.photo-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,6,14,.34),transparent 26%,transparent 44%,rgba(8,6,14,.55) 74%,rgba(8,6,14,.92))}
.ph-eyebrow{position:absolute;top:26px;left:0;right:0;z-index:1;text-align:center;font-size:.7rem;font-weight:600;letter-spacing:.44em;text-transform:uppercase;color:rgba(255,255,255,.92);margin-left:.44em;text-shadow:0 1px 10px rgba(0,0,0,.5)}
.ph-body{position:relative;z-index:1;width:100%;padding:0 22px clamp(34px,6vw,54px);text-align:center}
.photo-hero .names{margin-top:0;color:#fff;text-shadow:0 3px 30px rgba(0,0,0,.6)}
.photo-hero .orn{margin-top:18px}
.photo-hero .lede{color:rgba(255,255,255,.92);text-shadow:0 1px 14px rgba(0,0,0,.55)}
.photo-hero .hdate{color:rgba(255,255,255,.92);text-shadow:0 1px 12px rgba(0,0,0,.5)}
.gallery{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gallery img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:14px;border:1px solid rgba(255,255,255,.1);box-shadow:0 16px 36px -20px rgba(0,0,0,.7);background:url("${PHOTO_ICON}") center/40px no-repeat,linear-gradient(155deg,color-mix(in srgb,var(--accent) 46%,#241830),color-mix(in srgb,var(--accent) 12%,#0c0a14))}
.invite .sec{padding:0 clamp(18px,4vw,26px)}
.invite .sec h2{font-family:"Nanum Myeongjo",Georgia,serif;font-size:.98rem;font-weight:800;letter-spacing:.26em;color:color-mix(in srgb,var(--accent) 56%,#fff);margin-bottom:22px}
.bio{margin:0 auto;max-width:30ch;color:rgba(255,255,255,.78);font-size:clamp(1.02rem,2.4vw,1.1rem);line-height:2.1;white-space:pre-line;word-break:keep-all}
.cal{max-width:320px;margin:0 auto;padding:clamp(22px,3vw,28px) clamp(18px,3vw,26px);border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.cal-h{font-family:"Nanum Myeongjo",Georgia,serif;font-size:1.06rem;letter-spacing:.12em;color:#fff;margin-bottom:16px}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:7px 0;align-items:center}
.cal-w{font-size:.7rem;font-weight:600;color:rgba(255,255,255,.5);padding-bottom:6px}
.cal-c{font-size:.84rem;color:rgba(255,255,255,.72);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;margin:0 auto;width:88%}
.cal-grid > :nth-child(7n+1){color:color-mix(in srgb,#ff9bb0 72%,#fff)}
.cal-c.cal-on{background:var(--accent);color:#fff;font-weight:700;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%, transparent),0 6px 16px -4px color-mix(in srgb,var(--accent) 70%, transparent)}
.venue{font-family:"Nanum Myeongjo",Georgia,serif;font-size:clamp(1.1rem,2.7vw,1.3rem);color:#fff;line-height:1.6;word-break:keep-all}
.mapcard{position:relative;min-height:clamp(220px,30vw,290px);overflow:hidden;padding:0;border-radius:22px}
.map-svg{position:absolute;inset:0;width:100%;height:100%;background:radial-gradient(120% 90% at 50% 0%,#0f0c18,#08060e)}
.map-blocks rect{fill:rgba(255,255,255,.035);stroke:rgba(255,255,255,.05);stroke-width:1}
.map-park{fill:color-mix(in srgb,var(--accent) 18%, transparent);stroke:color-mix(in srgb,var(--accent) 26%, transparent);stroke-width:1}
.map-roads path{fill:none;stroke:rgba(255,255,255,.085);stroke-width:7;stroke-linecap:round}
.map-main{fill:none;stroke:color-mix(in srgb,var(--accent) 60%,#fff);stroke-width:5;stroke-linecap:round;opacity:.9}
.map-halo{fill:var(--accent);opacity:.3;filter:blur(9px)}
.map-ring{fill:none;stroke:color-mix(in srgb,var(--accent) 55%,#fff);stroke-width:2.5;transform-box:fill-box;transform-origin:center;animation:mapping 2.6s ease-out infinite}
.map-pin{fill:var(--accent);stroke:#fff;stroke-width:1.6}
.map-dot{fill:#fff}
@keyframes mapping{0%{transform:scale(.5);opacity:.8}70%{opacity:0}100%{transform:scale(2.4);opacity:0}}
.map-addr{position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;justify-content:center;gap:9px;padding:11px 14px;border-radius:14px;background:rgba(10,8,16,.55);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);color:rgba(255,255,255,.9);font-size:.9rem;line-height:1.4;word-break:keep-all;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.map-addr .map-pin-ic{flex:0 0 auto;color:color-mix(in srgb,var(--accent) 75%,#fff);display:grid;place-items:center}
.giftbox{padding:clamp(22px,3.4vw,30px)}
.gift-b{color:rgba(255,255,255,.84);font-size:1rem;line-height:1.85;white-space:pre-line;word-break:keep-all}
.mark{display:flex;align-items:center;justify-content:center;gap:7px;color:rgba(255,255,255,.42);font-size:.8rem;font-weight:500;margin-top:8px}
.mark .mk{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:color-mix(in srgb,var(--accent) 64%,#fff);font-weight:700}
@media (prefers-reduced-motion:reduce){.map-ring,.petals i{animation:none}.petals{display:none}}`;
  } else if (template.category === 'launch') {
    // 제품·프로젝트 런칭 — 다크 오로라 글래스 Coming Soon + 웨이트리스트: 배지 + 큰 제품명
    // + 가치 제안 + 이메일 대기 등록(비주얼) + 핵심 기능 3개. 공유=가입, 졸업(백엔드 연결) 훅.
    const featsHtml = has('features')
      ? (values.features ?? '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 6)
          .map((line, i) => {
            const parts = line.split('|').map((s) => s.trim());
            const nm = parts[0] ?? '';
            const ds = parts[1] ?? '';
            const im = parts[2] && /^https?:\/\//i.test(parts[2]) ? parts[2] : '';
            const media = im
              ? `<div class="feat-media"><img src="${escapeHtml(im)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>`
              : `<div class="feat-media feat-media-art"><span>${String(i + 1).padStart(2, '0')}</span></div>`;
            return `<article class="feat">${media}<div class="feat-txt"><div class="feat-n">${String(i + 1).padStart(2, '0')}</div><h3>${escapeHtml(nm)}</h3>${ds ? `<p>${escapeHtml(ds)}</p>` : ''}</div></article>`;
          })
          .join('')
      : '';
    // 출시 카운트다운 — date에서 연·월·일·시·분 추출(결정론적). 실제 카운트는 클라이언트 JS.
    const dm = has('date') ? (values.date ?? '').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/) : null;
    let cdHtml = '';
    let cdScript = '';
    if (dm) {
      const cy = Number(dm[1]);
      const cmo = Number(dm[2]);
      const cd = Number(dm[3]);
      const raw = values.date ?? '';
      const hm = raw.match(/(\d{1,2})\s*시/);
      let ch = hm ? Number(hm[1]) : 0;
      if (hm && /오후|pm/i.test(raw) && ch < 12) ch += 12;
      if (hm && /오전|am/i.test(raw) && ch === 12) ch = 0;
      const mim = raw.match(/(\d{1,2})\s*분/);
      const cmi = mim ? Number(mim[1]) : 0;
      const u = (k: string, l: string): string =>
        `<div class="cd-u"><span class="cd-n" data-k="${k}">--</span><span class="cd-l">${escapeHtml(l)}</span></div>`;
      cdHtml = `<div class="cd" id="cd" data-y="${cy}" data-mo="${cmo}" data-d="${cd}" data-h="${ch}" data-mi="${cmi}">${u('d', labels.cdDays)}${u('h', labels.cdHours)}${u('m', labels.cdMins)}${u('s', labels.cdSecs)}</div>`;
      cdScript = `<script>(function(){var el=document.getElementById('cd');if(!el)return;var t=new Date(+el.dataset.y,(+el.dataset.mo)-1,+el.dataset.d,+el.dataset.h||0,+el.dataset.mi||0).getTime();var ns=el.querySelectorAll('[data-k]');function p(n){return(n<10?'0':'')+n;}function tick(){var ms=t-Date.now();if(ms<0)ms=0;var s=Math.floor(ms/1000);var v={d:String(Math.floor(s/86400)),h:p(Math.floor(s%86400/3600)),m:p(Math.floor(s%3600/60)),s:p(s%60)};ns.forEach(function(n){n.textContent=v[n.getAttribute('data-k')];});}tick();setInterval(tick,1000);})();</script>`;
    }
    inner = `${RIP_DIV}
<main class="page launch">
<header class="hero">
<span class="badge"><i class="dot"></i>COMING SOON</span>
<h1>${title}</h1>
${has('tagline') ? `<p class="lede">${v('tagline')}</p>` : ''}
${cdHtml}
<div class="wait" id="wl"><input class="wait-in" type="email" placeholder="${escapeHtml(labels.emailPlaceholder)}" aria-label="${escapeHtml(labels.emailPlaceholder)}"><button class="wait-btn" type="button" id="wlb">${escapeHtml(labels.waitlistBtn)}</button></div>
<p class="proof" id="wlp">${escapeHtml(labels.waitlistProof)}</p>
</header>
${has('body') ? `<section class="sec"><h2>${labels.launchAbout}</h2><div class="bio">${v('body')}</div></section>` : ''}
${featsHtml ? `<section class="sec"><h2>${labels.launchFeatures}</h2><div class="feats">${featsHtml}</div></section>` : ''}
${has('contact') ? `<p class="contact-line">${escapeHtml((values.contact ?? '').trim())}</p>` : ''}
<footer class="mark"><span class="mk">&gt;_</span><span>${labels.madeWith}</span></footer>
</main>
${WAVE_SCRIPT}
${cdScript}
<script>(function(){var b=document.getElementById('wlb'),w=document.getElementById('wl'),p=document.getElementById('wlp');if(b){b.addEventListener('click',function(){w.innerHTML='<div class="wait-ok"><span class="ok-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.2 4.2L19 7.5"/></svg></span><span>'+${JSON.stringify(escapeHtml(labels.waitlistDone))}+'</span></div>';if(p){p.textContent=${JSON.stringify(labels.waitlistProof)};}});}})();</script>
${sparkScript({ cols: ['#bcdcff', '#ffffff', '#7aa8ff', '#a8f0ff'], rate: 60, moveN: 1, moveSp: 1.1, burstN: 20, burstSp: 5, grav: 0.04 })}`;
    css = `${AURORA_CSS}
.page.launch{position:relative;z-index:2;max-width:920px;margin:0 auto;padding:clamp(40px,7vw,84px) 0 clamp(40px,6vw,60px);display:flex;flex-direction:column;gap:clamp(34px,5vw,56px);text-align:center}
.hero{padding:0 18px}
.badge{display:inline-flex;align-items:center;gap:8px;padding:7px 15px;border-radius:999px;background:color-mix(in srgb,var(--accent) 16%, transparent);border:1px solid color-mix(in srgb,var(--accent) 38%, transparent);color:color-mix(in srgb,var(--accent) 72%,#fff);font-size:.72rem;font-weight:700;letter-spacing:.2em}
.badge .dot{width:7px;height:7px;border-radius:50%;background:color-mix(in srgb,var(--accent) 80%,#fff);animation:pulse 2s ease-out infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 55%, transparent)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
.launch h1{margin-top:24px;font-family:'Pretendard',-apple-system,sans-serif;font-weight:800;font-size:clamp(2.6rem,8vw,4.2rem);line-height:1.05;letter-spacing:-.04em;background:linear-gradient(176deg,#fff 34%,color-mix(in srgb,var(--accent) 52%,#fff));-webkit-background-clip:text;background-clip:text;color:transparent;word-break:keep-all;text-wrap:balance}
.lede{margin:20px auto 0;max-width:34ch;color:rgba(255,255,255,.76);font-size:clamp(1.06rem,2.4vw,1.28rem);line-height:1.6;word-break:keep-all}
.wait{display:flex;gap:9px;max-width:440px;margin:32px auto 0}
.wait-in{flex:1;min-width:0;padding:15px 18px;border-radius:15px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:1rem;outline:none;transition:border-color .15s ease}
.wait-in::placeholder{color:rgba(255,255,255,.45)}
.wait-in:focus{border-color:color-mix(in srgb,var(--accent) 60%, rgba(255,255,255,.2))}
.wait-btn{flex:0 0 auto;padding:15px 24px;border-radius:15px;background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 92%,#fff),var(--accent));color:#fff;font-weight:700;font-size:1rem;border:1px solid color-mix(in srgb,var(--accent) 55%,#fff);box-shadow:0 16px 34px -10px color-mix(in srgb,var(--accent) 80%, transparent),inset 0 1px 0 rgba(255,255,255,.34);cursor:pointer;transition:transform .15s ease}
.wait-btn:hover{transform:translateY(-2px)}
.wait-ok{width:100%;padding:15px 18px;border-radius:15px;background:color-mix(in srgb,var(--accent) 18%, transparent);border:1px solid color-mix(in srgb,var(--accent) 40%, transparent);color:#fff;font-weight:600;font-size:.98rem;display:flex;align-items:center;justify-content:center;gap:10px}
.ok-ic{flex:0 0 auto;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%, transparent)}
.ok-ic svg{width:14px;height:14px}
.proof{margin:14px auto 0;font-size:.86rem;color:rgba(255,255,255,.5)}
.cd{display:flex;justify-content:center;gap:clamp(8px,1.6vw,14px);margin:30px auto 0;flex-wrap:wrap}
.cd-u{display:flex;flex-direction:column;align-items:center;gap:7px;min-width:clamp(64px,11vw,86px);padding:16px 10px 12px;border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.022));border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 0 60px -30px color-mix(in srgb,var(--accent) 50%, transparent);backdrop-filter:blur(14px)}
.cd-n{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:clamp(1.7rem,4vw,2.4rem);font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.cd-l{font-size:.7rem;font-weight:600;letter-spacing:.1em;color:color-mix(in srgb,var(--accent) 58%,#fff)}
.launch .sec{padding:0 clamp(18px,4vw,24px)}
.launch .sec h2{font-size:.8rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:color-mix(in srgb,var(--accent) 58%,#fff);margin-bottom:20px}
.bio{margin:0 auto;max-width:48ch;color:rgba(255,255,255,.78);font-size:clamp(1.02rem,1.4vw,1.12rem);line-height:1.9;white-space:pre-line;word-break:keep-all}
.feats{display:flex;flex-direction:column;gap:clamp(22px,4.5vw,52px);text-align:left}
.feat{display:flex;align-items:center;gap:clamp(24px,4.5vw,56px)}
.feat:nth-child(even){flex-direction:row-reverse}
.feat-media{flex:1 1 0;min-width:0;position:relative;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.12);box-shadow:0 34px 80px -30px rgba(0,0,0,.88),0 0 80px -34px color-mix(in srgb,var(--accent) 42%, transparent)}
.feat-media img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
.feat-media-art{aspect-ratio:4/3;display:grid;place-items:center;background:linear-gradient(150deg,color-mix(in srgb,var(--accent) 58%, transparent),color-mix(in srgb,var(--accent) 12%, transparent))}
.feat-media-art span{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:2.6rem;font-weight:700;color:rgba(255,255,255,.55)}
.feat-txt{flex:1 1 0;min-width:0}
.feat-n{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.84rem;font-weight:700;letter-spacing:.08em;color:color-mix(in srgb,var(--accent) 64%,#fff);margin-bottom:13px}
.feat h3{font-size:clamp(1.3rem,2.3vw,1.7rem);font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.22;margin-bottom:12px;word-break:keep-all}
.feat p{font-size:clamp(1rem,1.4vw,1.1rem);color:rgba(255,255,255,.66);line-height:1.7;word-break:keep-all}
.contact-line{font-size:.9rem;color:rgba(255,255,255,.55);margin-top:4px}
.mark{display:flex;align-items:center;justify-content:center;gap:7px;color:rgba(255,255,255,.42);font-size:.8rem;font-weight:500;margin-top:6px}
.mark .mk{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:color-mix(in srgb,var(--accent) 64%,#fff);font-weight:700}
@media (max-width:720px){.feat,.feat:nth-child(even){flex-direction:column;gap:18px}.wait{flex-direction:column}}`;
  } else {
    // 나 소개 — 다크 오로라 글래스 '링크인바이오': 콘텐츠가 꽉 찬 개인 랜딩.
    // hero(모노그램+이름+역할+소개+키워드) → 연락 CTA → 링크 버튼 스택 → 브랜드 푸터.
    // 빈 placeholder는 0개. 입력(이름·역할·소개·연락처·키워드·링크)만으로 화면을 채운다.
    const first = escapeHtml(Array.from((values.title ?? '').trim())[0] ?? '·');
    // 공용 아이콘(stroke=currentColor). 링크는 도메인/라벨로 아이콘을 추정한다.
    const icMail =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>';
    const icPhone =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 3.5 9 4l1 4-2 1.4a12 12 0 0 0 6.6 6.6L16 14l4 1 .4 2.6a2 2 0 0 1-2 2.3A16 16 0 0 1 4.1 5.6a2 2 0 0 1 2.5-2.1z"/></svg>';
    const icInsta =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.9"/><circle cx="17.1" cy="6.9" r="1.05" fill="currentColor" stroke="none"/></svg>';
    const icPlay =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="4.5"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none"/></svg>';
    const icPen =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.6 18.4 9.5"/><path d="M4 20l1-4L16 5a2.05 2.05 0 0 1 2.9 2.9L8 19z"/></svg>';
    const icIn =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M8 10.5V16"/><path d="M8 7.7v.01"/><path d="M11.6 16v-3.1a2.1 2.1 0 0 1 4.2 0V16"/></svg>';
    const icLink =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 7.2 12.8 5.4a3.8 3.8 0 0 1 5.4 5.4l-2 2"/><path d="M13 16.8 11.2 18.6a3.8 3.8 0 0 1-5.4-5.4l2-2"/></svg>';
    const icChev =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 6 6 6-6 6"/></svg>';

    // 키워드 칩 — 콤마/줄바꿈 분리, 최대 8개.
    const tags = has('tags')
      ? (values.tags ?? '')
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    const tagsHtml = tags.length
      ? `<div class="tags">${tags.map((tg) => `<span class="tag">${escapeHtml(tg)}</span>`).join('')}</div>`
      : '';

    // 링크 버튼 — 한 줄에 하나, "라벨 | url" 또는 "url". http(s)만 href(주입 차단),
    // 도메인/라벨로 아이콘 추정, 라벨 없으면 도메인을 라벨로.
    const linksHtml = has('links')
      ? (values.links ?? '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 6)
          .map((line) => {
            const bar = line.indexOf('|');
            const labelRaw = bar >= 0 ? line.slice(0, bar).trim() : '';
            const rest = bar >= 0 ? line.slice(bar + 1).trim() : line;
            const m = rest.match(/https?:\/\/[^\s<>"']+/i);
            const url = m ? m[0] : null;
            const host = url
              ? url
                  .replace(/^https?:\/\//i, '')
                  .replace(/^www\./i, '')
                  .replace(/\/.*$/, '')
              : '';
            const label = labelRaw || host || rest;
            const k = `${labelRaw} ${rest}`.toLowerCase();
            const ic = /instagram|insta/.test(k)
              ? icInsta
              : /youtu/.test(k)
                ? icPlay
                : /linkedin|링크드인/.test(k)
                  ? icIn
                  : /brunch|velog|tistory|blog|note|브런치|블로그|글/.test(k)
                    ? icPen
                    : /news|letter|substack|stibee|maily|뉴스레터|구독/.test(k)
                      ? icMail
                      : icLink;
            const attr = url
              ? ` href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"`
              : '';
            const sub = host ? `<span class="lk-sub">${escapeHtml(host)}</span>` : '';
            return `<a class="lnk"${attr}><span class="lk-ic">${ic}</span><span class="lk-main"><span class="lk-label">${escapeHtml(label)}</span>${sub}</span><span class="lk-chev">${icChev}</span></a>`;
          })
          .join('')
      : '';

    // 연락처 primary CTA(accent, 풀폭).
    let cta = '';
    if (has('contact')) {
      const raw = (values.contact ?? '').trim();
      const href = contactHref(raw);
      const icon = href?.startsWith('mailto:')
        ? icMail
        : href?.startsWith('tel:')
          ? icPhone
          : icLink;
      let attr = '';
      if (href) {
        attr = ` href="${escapeHtml(href)}"`;
        if (href.startsWith('http')) attr += ' target="_blank" rel="noopener noreferrer"';
      }
      cta = `<a class="p-cta"${attr}><span class="p-cta-ic">${icon}</span><span>${escapeHtml(raw)}</span></a>`;
    }

    // 주요 작업 카드 — "제목 | 설명" 줄 목록(본문 콘텐츠). 최대 6개.
    const worksHtml = has('work')
      ? (values.work ?? '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 6)
          .map((line) => {
            const bar = line.indexOf('|');
            const wt = bar >= 0 ? line.slice(0, bar).trim() : line;
            const wd = bar >= 0 ? line.slice(bar + 1).trim() : '';
            return `<article class="work"><h3>${escapeHtml(wt)}</h3>${wd ? `<p>${escapeHtml(wd)}</p>` : ''}</article>`;
          })
          .join('')
      : '';

    // 데스크톱 2단: 좌 sticky 아이덴티티(.side) / 우 본문 섹션(.body-col). 모바일은 1단.
    inner = `<div class="rip"></div>
<div class="folio">
<aside class="side"><div class="glass id-card">
<div class="mono"><span>${first}</span></div>
<h1>${title}</h1>
${has('tagline') ? `<p class="role">${v('tagline')}</p>` : ''}
${cta}
</div></aside>
<main class="body-col">
${has('body') ? `<section class="sec"><h2>${labels.about}</h2><div class="bio">${v('body')}</div></section>` : ''}
${tags.length ? `<section class="sec"><h2>${labels.expertise}</h2>${tagsHtml}</section>` : ''}
${worksHtml ? `<section class="sec"><h2>${labels.work}</h2><div class="works">${worksHtml}</div></section>` : ''}
${linksHtml ? `<section class="sec"><h2>${labels.links}</h2><nav class="links">${linksHtml}</nav></section>` : ''}
<footer class="mark"><span class="mk">&gt;_</span><span>${labels.madeWith}</span></footer>
</main>
</div>
<script>(function(){var r=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var tx=.5,ty=.4,cx=.5,cy=.4,t=0,run=true;function loop(){if(!run)return;t+=.016;cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;var h=(20+(cx-.5)*300+(cy-.5)*120+Math.sin(t*.6)*12)%360;if(h<0)h+=360;r.style.setProperty('--mx',(cx+Math.sin(t*.9)*.05+Math.sin(t*.37)*.025).toFixed(4));r.style.setProperty('--my',(cy+Math.cos(t*.7)*.045+Math.sin(t*.51)*.025).toFixed(4));r.style.setProperty('--hue',h.toFixed(1));requestAnimationFrame(loop);}function move(e){var p=e.touches&&e.touches[0]?e.touches[0]:e;tx=p.clientX/innerWidth;ty=p.clientY/innerHeight;}addEventListener('pointermove',move,{passive:true});addEventListener('touchmove',move,{passive:true});document.addEventListener('visibilitychange',function(){if(document.hidden){run=false;}else if(!run){run=true;requestAnimationFrame(loop);}});requestAnimationFrame(loop);})();</script>`;
    css = `
body{background:#070611;color:#fff;min-height:100vh;padding:0 20px;font-family:'Pretendard',-apple-system,system-ui,"Apple SD Gothic Neo",sans-serif;overflow-x:hidden}
body::before{content:"";position:fixed;inset:-28%;z-index:0;pointer-events:none;filter:blur(80px) saturate(160%) hue-rotate(calc((var(--hue,20) - 20) * 1deg));opacity:.96;will-change:transform;transform:translate3d(calc((var(--mx,.5) - .5) * -100px),calc((var(--my,.4) - .4) * -100px),0) rotate(calc((var(--mx,.5) - .5) * 5deg)) scale(1.1);background:
 radial-gradient(36% 38% at 6% 3%, color-mix(in srgb,var(--accent) 96%, #ffb487), transparent 56%),
 radial-gradient(34% 36% at 96% 7%, #7b6bff, transparent 58%),
 radial-gradient(40% 42% at 95% 64%, #ff5d7a, transparent 56%),
 radial-gradient(38% 42% at 4% 80%, #1fe6d2, transparent 58%),
 radial-gradient(40% 40% at 90% 99%, color-mix(in srgb,var(--accent) 78%, #ff8a5c), transparent 60%)}
body::after{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.rip{position:fixed;inset:0;z-index:0;pointer-events:none;mix-blend-mode:screen;opacity:.95;filter:blur(18px);background:radial-gradient(46vmax 46vmax at calc(var(--mx,.5)*100%) calc(var(--my,.4)*100%),hsl(var(--hue,20) 85% 58% / .5),transparent 58%),radial-gradient(17vmax 17vmax at calc(var(--mx,.5)*100%) calc(var(--my,.4)*100%),hsl(calc(var(--hue,20) + 28) 92% 72% / .7),transparent 60%)}
.folio{position:relative;z-index:2;max-width:1080px;margin:0 auto;padding:clamp(34px,5vw,60px) 0 clamp(40px,6vw,64px);display:grid;grid-template-columns:354px minmax(0,1fr);gap:clamp(20px,2.4vw,30px)}
.glass{position:relative;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.022));border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 100px -34px rgba(0,0,0,.92),0 0 90px -22px color-mix(in srgb,var(--accent) 42%, transparent),inset 0 1px 0 rgba(255,255,255,.28);backdrop-filter:blur(28px) saturate(135%);-webkit-backdrop-filter:blur(28px) saturate(135%)}
.id-card{position:sticky;top:clamp(20px,4vw,40px);text-align:center;padding:clamp(34px,3vw,42px) clamp(22px,2vw,30px)}
.id-card h1{font-family:'Pretendard',-apple-system,sans-serif;font-weight:800;font-size:clamp(2rem,2.6vw,2.5rem);line-height:1.12;letter-spacing:-.035em;background:linear-gradient(176deg,#fff 36%,#ffd0b6);-webkit-background-clip:text;background-clip:text;color:transparent;word-break:keep-all;text-wrap:balance}
.mono{width:clamp(88px,8vw,104px);aspect-ratio:1;margin:0 auto 22px;border-radius:27px;display:grid;place-items:center;position:relative;background:linear-gradient(150deg,color-mix(in srgb,var(--accent) 84%,#ffb98a),color-mix(in srgb,var(--accent) 44%,#2a160d));border:1px solid rgba(255,255,255,.2);box-shadow:0 20px 44px -10px color-mix(in srgb,var(--accent) 78%, transparent),0 0 0 6px color-mix(in srgb,var(--accent) 12%, transparent),inset 0 1px 0 rgba(255,255,255,.45)}
.mono::after{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(78% 58% at 30% 18%,rgba(255,255,255,.55),transparent 62%);opacity:.55}
.mono span{position:relative;z-index:1;font-weight:800;font-size:clamp(34px,3.4vw,42px);color:#fff;letter-spacing:-.02em;text-shadow:0 2px 10px rgba(0,0,0,.28)}
.role{margin-top:16px;display:inline-block;padding:7px 16px;border-radius:999px;background:color-mix(in srgb,var(--accent) 20%, transparent);border:1px solid color-mix(in srgb,var(--accent) 42%, transparent);color:#ffcdb6;font-weight:600;font-size:.92rem;letter-spacing:.01em}
.body-col{min-width:0;display:flex;flex-direction:column;gap:clamp(26px,3vw,40px);padding-top:clamp(6px,1vw,14px)}
.sec h2{font-size:.8rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:color-mix(in srgb,var(--accent) 52%,#fff);display:flex;align-items:center;gap:14px;margin-bottom:16px}
.sec h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.14),transparent)}
.bio{color:rgba(255,255,255,.78);font-size:clamp(1.02rem,1.2vw,1.12rem);line-height:1.9;white-space:pre-line;word-break:keep-all}
.tags{display:flex;flex-wrap:wrap;gap:9px}
.tag{padding:7px 14px;border-radius:999px;font-size:.86rem;font-weight:500;color:rgba(255,255,255,.84);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(6px)}
.works{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:13px}
.work{padding:20px 20px 21px;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.022));border:1px solid rgba(255,255,255,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.1);backdrop-filter:blur(14px);transition:transform .15s ease,border-color .15s ease}
.work:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 45%, rgba(255,255,255,.12))}
.work h3{font-size:1.04rem;font-weight:700;color:#fff;letter-spacing:-.01em;margin-bottom:8px;word-break:keep-all}
.work p{font-size:.92rem;color:rgba(255,255,255,.64);line-height:1.65;word-break:keep-all}
.p-cta{margin-top:24px;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:15px 22px;border-radius:18px;background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 92%,#ff9a63),var(--accent));color:#fff;text-decoration:none;font-weight:700;font-size:.98rem;border:1px solid color-mix(in srgb,var(--accent) 55%,#fff);box-shadow:0 18px 38px -12px color-mix(in srgb,var(--accent) 80%, transparent),inset 0 1px 0 rgba(255,255,255,.34);transition:transform .16s ease,box-shadow .16s ease}
.p-cta:hover{transform:translateY(-2px);box-shadow:0 24px 48px -14px color-mix(in srgb,var(--accent) 85%, transparent),inset 0 1px 0 rgba(255,255,255,.4)}
.p-cta-ic{display:grid;place-items:center}
.p-cta-ic svg{width:18px;height:18px}
.links{display:flex;flex-direction:column;gap:11px;width:100%}
.lnk{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.072),rgba(255,255,255,.026));border:1px solid rgba(255,255,255,.1);box-shadow:0 14px 30px -20px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.1);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%);text-decoration:none;color:#fff;transition:transform .15s ease,border-color .15s ease,background .15s ease}
.lnk:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--accent) 50%, rgba(255,255,255,.12));background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.035))}
.lnk .lk-ic{flex:0 0 auto;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#fff;background:color-mix(in srgb,var(--accent) 20%, rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.1)}
.lnk .lk-ic svg{width:20px;height:20px}
.lnk .lk-main{flex:1;min-width:0;display:flex;flex-direction:column;text-align:left}
.lnk .lk-label{font-weight:600;font-size:.99rem;color:#fff;line-height:1.25}
.lnk .lk-sub{font-size:.76rem;color:rgba(255,255,255,.5);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lnk .lk-chev{flex:0 0 auto;color:rgba(255,255,255,.38)}
.lnk .lk-chev svg{width:18px;height:18px}
.mark{display:flex;align-items:center;justify-content:center;gap:7px;color:rgba(255,255,255,.42);font-size:.8rem;font-weight:500;letter-spacing:.01em;margin-top:6px}
.mark .mk{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:color-mix(in srgb,var(--accent) 64%,#fff);font-weight:700}`;
  }

  return `<!doctype html>
<html lang="${labels.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>:root{--accent:${accent}}${BASE_CSS}${css}</style></head>
<body>${inner}</body></html>`;
}
