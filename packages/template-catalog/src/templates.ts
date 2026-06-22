import type {
  TemplateDefinition,
  TemplateFieldKey,
  TemplateFieldKind,
} from '@vibestart/shared-types';

/** 칸별 입력 형태(웹 어댑터가 input/textarea 선택에 사용). */
export const FIELD_KINDS: Record<TemplateFieldKey, TemplateFieldKind> = {
  title: 'text',
  tagline: 'text',
  body: 'textarea',
  contact: 'text',
  tags: 'text',
  work: 'textarea',
  links: 'textarea',
  menu: 'textarea',
  hours: 'textarea',
  location: 'text',
  date: 'text',
  venue: 'text',
  photos: 'textarea',
  features: 'textarea',
};

export const introTemplate: TemplateDefinition = {
  id: 'intro',
  category: 'intro',
  fields: ['title', 'tagline', 'body', 'tags', 'work', 'links', 'contact'],
  accent: '#b4532a',
};

export const shopTemplate: TemplateDefinition = {
  id: 'shop',
  category: 'shop',
  fields: ['title', 'tagline', 'body', 'menu', 'hours', 'location', 'contact'],
  accent: '#2a6b4f',
};

export const invitationTemplate: TemplateDefinition = {
  id: 'invitation',
  category: 'invitation',
  fields: ['title', 'tagline', 'date', 'venue', 'location', 'body', 'photos', 'contact'],
  accent: '#8a5a9e',
};

export const launchTemplate: TemplateDefinition = {
  id: 'launch',
  category: 'launch',
  fields: ['title', 'tagline', 'date', 'body', 'features', 'contact'],
  accent: '#5b6cff',
};

export const templates: TemplateDefinition[] = [
  introTemplate,
  shopTemplate,
  launchTemplate,
  invitationTemplate,
];
