import { routing } from '@/i18n/routing';

/**
 * 사이트 정본 origin. 루트 [locale]/layout.tsx의 siteUrl과 동일해야 한다.
 */
const siteUrl = 'https://vibe-start.com';

/** 로케일별 베이스 URL — 기본 로케일은 루트(/), 그 외는 프리픽스(/en 등). */
export function localeBase(locale: string): string {
  return locale === routing.defaultLocale ? siteUrl : `${siteUrl}/${locale}`;
}

/**
 * 한 페이지(path)의 canonical + hreflang(languages)을 만든다.
 *
 * 루트 레이아웃은 로케일 루트만 canonical로 주므로 하위 라우트는 자기 경로를
 * 가리키는 canonical을 따로 설정해야 한다(없으면 Lighthouse SEO에서 감점).
 * path는 로케일 프리픽스를 뺀 경로(예: 'start').
 */
export function pageAlternates(
  locale: string,
  path: string,
): { canonical: string; languages: Record<string, string> } {
  const seg = path ? `/${path.replace(/^\/+/, '')}` : '';
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) languages[loc] = localeBase(loc) + seg;
  languages['x-default'] = siteUrl + seg;
  return { canonical: localeBase(locale) + seg, languages };
}
