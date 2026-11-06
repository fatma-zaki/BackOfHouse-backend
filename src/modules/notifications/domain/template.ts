const PLACEHOLDER = /\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g;

export type TemplateVars = Record<string, string | number>;

/** The variable names a template uses, sorted and without repeats. */
export function placeholdersOf(template: string): string[] {
  return [...new Set([...template.matchAll(PLACEHOLDER)].map((match) => match[1]))].sort();
}

/**
 * Fills `{{name}}` placeholders. A missing variable is a bug in the catalog or the
 * handler, so it throws instead of sending a half-filled message.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(PLACEHOLDER, (_, name: string) => {
    const value = vars[name];
    if (value === undefined || value === null) throw new Error(`Template variable "${name}" is missing`);
    return String(value);
  });
}
