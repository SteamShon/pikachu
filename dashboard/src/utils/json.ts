import type { Prisma } from "@prisma/client";

export function jsonParseWithFallback(
  s: string | undefined | null,
  fallback: Record<string, unknown> = {}
): Record<string, unknown> {
  try {
    if (!s) return fallback;

    const parsed = JSON.parse(s);

    return parsed as Record<string, unknown>;
  } catch (error) {
    return fallback;
  }
}
export function extractValue({
  object,
  paths,
}: {
  object?: Prisma.JsonValue;
  paths: string[];
}) {
  return paths.reduce((prev, path) => {
    const isObject = prev && typeof prev === "object" && !Array.isArray(prev);

    if (isObject) {
      return (prev as Prisma.JsonObject)?.[path];
    } else return undefined;
  }, object);
}

export function extractKeys(
  object: Record<string, unknown>,
  paths: string[]
): string[][] {
  return Object.entries(object).flatMap(([k, v]) => {
    const newPaths = [...paths, k];

    if (typeof v === "object") {
      return extractKeys(v as Record<string, unknown>, newPaths);
    } else {
      return [newPaths];
    }
  });
}
