import type { ContentTypeInfo } from "@prisma/client";
import { extractValue, jsonParseWithFallback } from "./json";
import { v4 as uuidv4 } from 'uuid';

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

export function toNewCreative(values: string | undefined) {
  return {
    id: uuidv4(),
    content: jsonParseWithFallback(values),
  }
}

export function toNewCreativeFromObject(values: {[key:string]:unknown}) {
  return {
    id: uuidv4(),
    content: values,
  }
}