/**
 * B′ 첫성공 — 설치 없이 브라우저에서 한 페이지를 만드는 빌더의 데이터 형태.
 *
 * 렌더는 결정론적(값 → HTML 문자열)이며, 사용자 값은 렌더 시 모두 이스케이프된다.
 * 구조는 카탈로그(신뢰)에서, 내용은 사용자(신뢰 불가)에서 온다.
 */

export type TemplateCategory = 'intro' | 'shop' | 'invitation' | 'todo';

export type TemplateFieldKey = 'title' | 'tagline' | 'body' | 'contact';

export type TemplateFieldKind = 'text' | 'textarea';

export interface TemplateDefinition {
  id: string;
  category: TemplateCategory;
  /** 사용하는 칸(순서대로). title이 첫째이며 사실상 필수다. */
  fields: TemplateFieldKey[];
  /** 테마 강조색(hex). 렌더에서 신뢰값으로 주입한다. */
  accent: string;
}

/** 채워진 값. 비어 있으면 렌더 시 빈 슬롯으로 처리된다. */
export type TemplateValues = Partial<Record<TemplateFieldKey, string>>;

/**
 * 렌더된 페이지의 **구조 라벨**(섹션 머리말·데모 텍스트). 사용자 콘텐츠가 아니라
 * 페이지 chrome이라 로케일을 타야 한다 — 도메인(renderTemplate)은 i18n을 모르므로
 * 호출자(웹앱)가 활성 로케일의 라벨을 주입한다. todoProgress는 `%total%`/`%done%`
 * 토큰을 포함하는 템플릿 문자열(렌더가 치환).
 */
export type TemplatePreviewLabels = {
  /** <html lang> 값 */
  lang: string;
  about: string;
  directions: string;
  gallery: string;
  guestbook: string;
  guestbookPlaceholder: string;
  guestbookSamples: { who: string; msg: string }[];
  todoAdd: string;
  todoProgress: string;
};
