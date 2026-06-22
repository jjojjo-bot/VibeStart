import type { TemplateDefinition } from '@vibestart/shared-types';
import { templates } from './templates';

export {
  templates,
  FIELD_KINDS,
  introTemplate,
  shopTemplate,
  invitationTemplate,
  launchTemplate,
} from './templates';
export { renderTemplate, escapeHtml, contactHref, DEFAULT_PREVIEW_LABELS } from './render';
export { sanitizeTemplateValues, MAX_FIELD_LEN } from './sanitize';

export const templateRegistry: ReadonlyMap<string, TemplateDefinition> = new Map(
  templates.map((t) => [t.id, t]),
);

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templateRegistry.get(id);
}
