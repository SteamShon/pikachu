import Mustache from "mustache";

export function extractVariables(text?: string | null) {
  if (!text) return undefined;

  try {
    const parsed = Mustache.parse(text);
    return parsed.filter((v) => v[0] === "name").map((v) => v[1]);
  } catch (e) {
    console.log(e);
    return undefined;
  }
}
export function toPlainText(template: string) {
  const pattern = /@\[(.*?)\]\(.*?\)/gm;
  const result = template.replace(pattern, "$1");

  return result;
}
export function substitute(template: string, data?: Record<string, unknown>) {
  if (!data) return template;
  const rawTemplate = toPlainText(template);

  const variables = extractVariables(rawTemplate);

  variables?.forEach((variable) => {
    const value = data[`${variable}`];
    if (!value) {
      data[`${variable}`] = `{{${variable}}}`;
    }
  });
  return Mustache.render(rawTemplate, data);
}
