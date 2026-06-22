/**
 * B′ 첫성공 — 설치 없이 브라우저에서 한 페이지를 만드는 빌더의 데이터 형태.
 *
 * 렌더는 결정론적(값 → HTML 문자열)이며, 사용자 값은 렌더 시 모두 이스케이프된다.
 * 구조는 카탈로그(신뢰)에서, 내용은 사용자(신뢰 불가)에서 온다.
 */

export type TemplateCategory = 'intro' | 'shop' | 'invitation' | 'launch';

export type TemplateFieldKey =
  | 'title'
  | 'tagline'
  | 'body'
  | 'contact'
  | 'tags'
  | 'work'
  | 'links'
  | 'menu'
  | 'hours'
  | 'location'
  | 'date'
  | 'venue'
  | 'photos'
  | 'features';

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
 * 렌더된 페이지의 **구조 라벨**(섹션 머리말·고정 UI 텍스트). 사용자 콘텐츠가 아니라
 * 페이지 chrome이라 로케일을 타야 한다 — 도메인(renderTemplate)은 i18n을 모르므로
 * 호출자(웹앱)가 활성 로케일의 라벨을 주입한다. weekdays는 일~토 7개(달력용).
 */
export type TemplatePreviewLabels = {
  /** <html lang> 값 */
  lang: string;
  /** 공통 푸터 — "VibeStart로 만든 페이지" */
  madeWith: string;
  // intro(나 소개)
  about: string;
  expertise: string;
  work: string;
  links: string;
  // shop(가게) · invitation(청첩장) 공용
  directions: string;
  // shop
  menu: string;
  hours: string;
  // invitation
  invite: string;
  ourMoments: string;
  weddingDate: string;
  venueHeading: string;
  giftHeading: string;
  /** 달력 요일 머리글(일·월·화·수·목·금·토 순서, 7개) */
  weekdays: string[];
  // launch(출시 예고)
  launchAbout: string;
  launchFeatures: string;
  cdDays: string;
  cdHours: string;
  cdMins: string;
  cdSecs: string;
  emailPlaceholder: string;
  waitlistBtn: string;
  waitlistProof: string;
  waitlistDone: string;
};
