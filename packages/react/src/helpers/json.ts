export function jsonParseWithFallback(
  s: string | undefined | null,
  fallback: Record<string, unknown> = {},
): Record<string, unknown> {
  try {
    if (!s) return fallback;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(s);

    return parsed as Record<string, unknown>;
  } catch (error) {
    return fallback;
  }
}
function removeRenderFunction(code: string): string {
  const lines = code.split('\n').filter((line) => !line.includes('render ('));
  return lines.join('\n');
}
export function replacePropsInFunction({
  code,
  creatives,
}: {
  code: string;
  creatives: {
    id: string;
    content: { [key: string]: unknown };
    [key: string]: unknown;
  }[];
}) {
  const replaceValue = `render (new Test(${JSON.stringify(creatives)}))`;

  return [removeRenderFunction(code), replaceValue].join('\n');
}
export const parseAdSetResponse = (data: Record<string, unknown>) => {
  const contentType = data?.content_type as Record<string, unknown> | undefined;
  const details = contentType?.details as Record<string, unknown> | undefined;
  const code = details?.code as string | undefined;

  const contents = data?.contents as Record<string, unknown>[] | undefined;

  return { code, contents };
};
export const parseResponse = (data: Record<string, unknown>) => {
  const code: string | undefined = (
    (
      (
        (data.matched_ads as Record<string, unknown>[] | undefined)?.[0]
          ?.contentType as Record<string, undefined> | undefined
      )?.contentTypeInfo as Record<string, unknown> | undefined
    )?.details as Record<string, unknown> | undefined
  )?.code as string;

  const creatives:
    | (Record<string, unknown> & { content?: Record<string, unknown> })[]
    | undefined = (
    data.matched_ads as Record<string, unknown>[] | undefined
  )?.flatMap((placement) => {
    return (placement.campaigns as Record<string, unknown>[])?.flatMap(
      (campaign) => {
        return (campaign.adGroups as Record<string, unknown>[])?.flatMap(
          (adGroup) => {
            return adGroup.creatives as Record<string, unknown>[];
          },
        );
      },
    );
  });

  return { code, creatives };
};

export function parseResult({
  useAdSet,
  data,
}: {
  useAdSet: boolean | undefined;
  data: unknown;
}) {
  if (useAdSet) {
    const { code, contents } = parseAdSetResponse(data as Record<string, unknown>);
    const contentValues = contents?.map((content) => {
      return {
        id: content.id as string,
        content: jsonParseWithFallback(content?.values as string),
      };
    });
    return { parsedCode: code, contents, contentValues, creatives: undefined };
  } else {
    const { code, creatives } = parseResponse(data as Record<string, unknown>);
    const contentValues = creatives?.map((creative) => {
      return {
        id: creative.id as string,
        content: jsonParseWithFallback(creative?.content?.values as string),
      };
    });
    return { parsedCode: code, contents: undefined, contentValues, creatives };
  }
}
