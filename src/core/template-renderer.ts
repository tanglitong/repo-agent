export function renderTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? values[key] : match,
  );
}
