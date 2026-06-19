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
};

export const introTemplate: TemplateDefinition = {
  id: 'intro',
  category: 'intro',
  fields: ['title', 'tagline', 'body', 'contact'],
  accent: '#b4532a',
};

export const shopTemplate: TemplateDefinition = {
  id: 'shop',
  category: 'shop',
  fields: ['title', 'tagline', 'body', 'contact'],
  accent: '#2a6b4f',
};

export const invitationTemplate: TemplateDefinition = {
  id: 'invitation',
  category: 'invitation',
  fields: ['title', 'tagline', 'body'],
  accent: '#8a5a9e',
};

export const todoTemplate: TemplateDefinition = {
  id: 'todo',
  category: 'todo',
  fields: ['title', 'tagline', 'body'],
  accent: '#4f46e5',
};

export const templates: TemplateDefinition[] = [
  introTemplate,
  shopTemplate,
  todoTemplate,
  invitationTemplate,
];
