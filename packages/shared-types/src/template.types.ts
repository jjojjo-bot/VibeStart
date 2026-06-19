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
