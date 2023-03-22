import type { ContentTypeInfo } from "@prisma/client";
import { extractValue } from "./json";

export function extractSchema(contentTypeInfo?: ContentTypeInfo | null) {
  if (!contentTypeInfo) return undefined;

  return extractValue({
    object: contentTypeInfo?.details,
    paths: ["schema"],
  }) as string | undefined;
}

export function extractDefaultValues(contentTypeInfo?: ContentTypeInfo | null) {
  if (!contentTypeInfo) return undefined;

  return extractValue({
    object: contentTypeInfo?.details,
    paths: ["defaultValues"],
  }) as string | undefined;
}

export function extractCode(contentTypeInfo?: ContentTypeInfo | null) {
  if (!contentTypeInfo) return undefined;

  return extractValue({
    object: contentTypeInfo?.details,
    paths: ["code"],
  }) as string | undefined;
}

export function extractModelId(contentTypeInfo?: ContentTypeInfo | null) {
  if (!contentTypeInfo) return undefined;

  return extractValue({
    object: contentTypeInfo?.details,
    paths: ["id"],
  }) as string | undefined;
}

export function extractModelName(contentTypeInfo?: ContentTypeInfo | null) {
  if (!contentTypeInfo) return undefined;

  return extractValue({
    object: contentTypeInfo?.details,
    paths: ["name"],
  }) as string | undefined;
}
