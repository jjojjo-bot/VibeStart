import type { TemplateDefinition } from '@vibestart/shared-types';
import { templates } from './templates';

export {
  templates,
  FIELD_KINDS,
  introTemplate,
  shopTemplate,
  invitationTemplate,
} from './templates';
export { renderTemplate, escapeHtml } from './render';

export const templateRegistry: ReadonlyMap<string, TemplateDefinition> = new Map(
  templates.map((t) => [t.id, t]),
);

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templateRegistry.get(id);
}
