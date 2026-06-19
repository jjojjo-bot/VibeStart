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
 * 템플릿 + 값 → 완성된 한 페이지 HTML(문자열).
 *
 * 결정론적이며 사용자 값은 모두 이스케이프한다. accent는 카탈로그의 신뢰값이라
 * CSS에 직접 주입한다. 반환 HTML은 iframe srcDoc 등 격리된 곳에 렌더한다.
 */
export function renderTemplate(template: TemplateDefinition, values: TemplateValues): string {
  const accent = template.accent;
  const val = (key: TemplateFieldKeyLocal): string => escapeHtml((values[key] ?? '').trim());
  const has = (key: TemplateFieldKeyLocal): boolean =>
    template.fields.includes(key) && (values[key] ?? '').trim().length > 0;

  const parts: string[] = [`<h1>${val('title')}</h1>`];
  if (has('tagline')) parts.push(`<p class="tagline">${val('tagline')}</p>`);
  if (has('body')) parts.push(`<div class="body">${val('body')}</div>`);
  if (has('contact')) parts.push(`<span class="contact">${val('contact')}</span>`);

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${val('title')}</title>
<style>
*{margin:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;background:#faf7f0;color:#2a2722;line-height:1.6}
.bar{height:6px;background:${accent}}
.wrap{max-width:680px;margin:0 auto;padding:72px 28px}
h1{font-size:2.6rem;letter-spacing:-.02em;color:#23201b}
.tagline{font-size:1.2rem;color:#6b6459;margin-top:14px;font-style:italic}
.body{margin-top:30px;font-size:1.05rem;white-space:pre-line}
.contact{margin-top:36px;display:inline-block;border:1px solid ${accent};color:${accent};padding:10px 22px;border-radius:999px;font-family:-apple-system,system-ui,sans-serif;font-size:.95rem}
</style></head>
<body><div class="bar"></div><div class="wrap">${parts.join('\n')}</div></body></html>`;
}

// 로컬 별칭(shared-types의 TemplateFieldKey와 동일). 가독성용.
type TemplateFieldKeyLocal = keyof TemplateValues;
