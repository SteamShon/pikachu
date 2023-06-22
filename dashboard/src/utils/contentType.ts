import type { ContentType } from "@prisma/client";
import { extractValue, jsonParseWithFallback } from "./json";
import { v4 as uuidv4 } from "uuid";

export function extractSchema(contentType?: ContentType | null) {
  if (!contentType) return undefined;

  return extractValue({
    object: contentType?.details,
    paths: ["schema"],
  }) as string | undefined;
}

export function extractDefaultValues(contentType?: ContentType | null) {
  if (!contentType) return undefined;

  return extractValue({
    object: contentType?.details,
    paths: ["defaultValues"],
  }) as string | undefined;
}

export function extractCode(contentType?: ContentType | null) {
  if (!contentType) return undefined;

  return extractValue({
    object: contentType?.details,
    paths: ["code"],
  }) as string | undefined;
}

export function extractModelId(contentType?: ContentType | null) {
  if (!contentType) return undefined;

  return extractValue({
    object: contentType?.details,
    paths: ["id"],
  }) as string | undefined;
}

export function extractModelName(contentType?: ContentType | null) {
  if (!contentType) return undefined;

  return extractValue({
    object: contentType?.details,
    paths: ["name"],
  }) as string | undefined;
}

export function toNewCreative(values?: string | undefined) {
  return {
    id: uuidv4(),
    content: jsonParseWithFallback(values),
  };
}

export function toNewCreativeFromObject(values: { [key: string]: unknown }) {
  return {
    id: uuidv4(),
    content: values,
  };
}
