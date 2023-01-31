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
